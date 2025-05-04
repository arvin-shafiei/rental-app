import { Request, Response } from 'express';
import path from 'path';
import { PropertyService } from '../services/propertyService';
import { DocumentService } from '../services/documentService';
import { supabaseAdmin } from '../services/supabase';
import { BaseController } from '../utils/controllerUtils';
import { Logger } from '../utils/loggerUtils';

export class DocumentController extends BaseController {
  private propertyService: PropertyService;
  private documentService: DocumentService;
  private logger: Logger;

  constructor() {
    super();
    this.propertyService = new PropertyService();
    this.documentService = new DocumentService();
    this.logger = new Logger('DocumentController');
  }

  /**
   * Upload a single document
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    this.logger.methodStart('uploadDocument');
    
    try {
      if (!req.file) {
        this.sendError(res, 'No document file provided', 400);
        return;
      }
      
      // Get property ID and document type from query parameters
      const propertyId = req.query.propertyId as string;
      const documentType = req.query.documentType as string | undefined;
      
      if (!propertyId) {
        this.sendError(res, 'propertyId query parameter is required', 400);
        return;
      }
      
      const userId = this.getUserId(req);
      
      this.logger.info(`Uploading document for property: ${propertyId}, type: ${documentType || 'general'}`);
      
      // Upload to Supabase storage using service role
      const supabasePath = await this.documentService.uploadDocument(
        req.file.buffer, 
        userId, 
        propertyId, 
        documentType, 
        req.file.originalname,
        req.file.mimetype
      );
      
      // Get a public URL for the uploaded file
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('room-media')
        .getPublicUrl(supabasePath);
      
      const documentData = {
        filename: path.basename(supabasePath),
        originalName: req.file.originalname,
        path: supabasePath,
        propertyId,
        documentType: documentType || 'general',
        url: publicUrlData.publicUrl,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
      
      this.logger.info(`Document uploaded successfully at path: ${supabasePath}`);
      this.sendSuccess(res, 'Document uploaded successfully', documentData);
    } catch (error: any) {
      this.logger.methodError('uploadDocument', error);
      this.sendError(res, 'Error uploading document', 500, error);
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
    this.logger.methodStart('uploadMultipleDocuments');
    
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        this.sendError(res, 'No document files provided', 400);
        return;
      }
      
      // Get property ID and document type from query parameters
      const propertyId = req.query.propertyId as string;
      const documentType = req.query.documentType as string | undefined;
      
      if (!propertyId) {
        this.sendError(res, 'propertyId query parameter is required', 400);
        return;
      }
      
      const userId = this.getUserId(req);
      
      this.logger.info(`Uploading ${(req.files as Express.Multer.File[]).length} documents for property: ${propertyId}`);
      
      // Process all uploaded files
      const uploadedFiles = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          // Upload to Supabase storage using service role
          const supabasePath = await this.documentService.uploadDocument(
            file.buffer, 
            userId, 
            propertyId, 
            documentType, 
            file.originalname,
            file.mimetype
          );
          
          // Get a public URL for the uploaded file
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('room-media')
            .getPublicUrl(supabasePath);
          
          return {
            filename: path.basename(supabasePath),
            originalName: file.originalname,
            path: supabasePath,
            propertyId,
            documentType: documentType || 'general',
            url: publicUrlData.publicUrl,
            size: file.size,
            mimeType: file.mimetype
          };
        })
      );
      
      this.logger.info(`Successfully uploaded ${uploadedFiles.length} documents`);
      this.sendSuccess(res, 'Documents uploaded successfully', { files: uploadedFiles });
    } catch (error: any) {
      this.logger.methodError('uploadMultipleDocuments', error);
      this.sendError(res, 'Error uploading documents', 500, error);
    }
  }

  /**
   * List documents for a property
   */
  async listPropertyDocuments(req: Request, res: Response): Promise<void> {
    const propertyId = req.params.propertyId;
    const userId = this.getUserId(req);
    
    this.logger.methodStart('listPropertyDocuments', { propertyId, userId });
    
    try {
      // Check if the property exists and belongs to the user
      const property = await this.propertyService.getPropertyById(propertyId, userId);
      
      if (!property) {
        this.sendError(res, `Property with ID ${propertyId} not found or you don't have access to it`, 404);
        return;
      }
      
      // Get documents for the property
      const documentTypes = await this.documentService.listPropertyDocuments(userId, propertyId);
      
      this.logger.info(`Found ${documentTypes.length} document type categories`);
      this.sendSuccess(res, 'Documents retrieved successfully', documentTypes);
    } catch (error: any) {
      this.logger.methodError('listPropertyDocuments', error);
      this.sendError(res, 'Error listing property documents', 500, error);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    const documentPath = req.params.documentPath;
    const userId = this.getUserId(req);
    
    this.logger.methodStart('deleteDocument', { documentPath });
    
    try {
      // Extract property ID from the path (format: userId/propertyId/documents/...)
      const pathParts = documentPath.split('/');
      
      // Ensure path has correct structure and the user ID matches
      if (pathParts.length < 4 || pathParts[0] !== userId) {
        this.sendError(res, 'Access denied: You do not have permission to delete this document', 403);
        return;
      }
      
      const propertyId = pathParts[1];
      
      // Check if the property exists and belongs to the user
      const property = await this.propertyService.getPropertyById(propertyId, userId);
      
      if (!property) {
        this.sendError(res, `Property with ID ${propertyId} not found or you don't have access to it`, 404);
        return;
      }
      
      // Delete the document
      await this.documentService.deleteDocument(documentPath);
      
      this.logger.info(`Document deleted successfully: ${documentPath}`);
      this.sendSuccess(res, 'Document deleted successfully');
    } catch (error: any) {
      this.logger.methodError('deleteDocument', error);
      this.sendError(res, 'Error deleting document', 500, error);
    }
  }
} 