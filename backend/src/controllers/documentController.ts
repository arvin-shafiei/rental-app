import { Request, Response } from 'express';
import path from 'path';
import { PropertyService } from '../services/propertyService';
import { DocumentService } from '../services/documentService';
import { supabaseAdmin } from '../services/supabase';

export class DocumentController {
  private propertyService: PropertyService;
  private documentService: DocumentService;

  constructor() {
    this.propertyService = new PropertyService();
    this.documentService = new DocumentService();
  }

  /**
   * Upload a single document
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No document file provided'
        });
        return;
      }
      
      // Get property ID and document type from query parameters
      const propertyId = req.query.propertyId as string;
      const documentType = req.query.documentType as string | undefined;
      
      if (!propertyId) {
        res.status(400).json({
          success: false,
          message: 'propertyId query parameter is required'
        });
        return;
      }
      
      const user = (req as any).user;
      const userId = user.id;
      
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
      
      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          filename: path.basename(supabasePath),
          originalName: req.file.originalname,
          path: supabasePath,
          propertyId,
          documentType: documentType || 'general',
          url: publicUrlData.publicUrl,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading document',
        error: error.message
      });
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({
          success: false,
          message: 'No document files provided'
        });
        return;
      }
      
      // Get property ID and document type from query parameters
      const propertyId = req.query.propertyId as string;
      const documentType = req.query.documentType as string | undefined;
      
      if (!propertyId) {
        res.status(400).json({
          success: false,
          message: 'propertyId query parameter is required'
        });
        return;
      }
      
      const user = (req as any).user;
      const userId = user.id;
      
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
      
      res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          files: uploadedFiles
        }
      });
    } catch (error: any) {
      console.error('Error uploading documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading documents',
        error: error.message
      });
    }
  }

  /**
   * List documents for a property
   */
  async listPropertyDocuments(req: Request, res: Response): Promise<void> {
    try {
      const propertyId = req.params.propertyId;
      const user = (req as any).user;
      const userId = user.id;
      
      // Check if the property exists and belongs to the user
      const property = await this.propertyService.getPropertyById(propertyId, userId);
      
      if (!property) {
        res.status(404).json({
          success: false,
          message: `Property with ID ${propertyId} not found or you don't have access to it`
        });
        return;
      }
      
      // Get documents for the property
      const documentTypes = await this.documentService.listPropertyDocuments(userId, propertyId);
      
      res.status(200).json({
        success: true,
        data: documentTypes
      });
    } catch (error: any) {
      console.error('Error listing property documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error listing property documents',
        error: error.message
      });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentPath = req.params.documentPath;
      const user = (req as any).user;
      const userId = user.id;
      
      // Extract property ID from the path (format: userId/propertyId/documents/...)
      const pathParts = documentPath.split('/');
      
      // Ensure path has correct structure and the user ID matches
      if (pathParts.length < 4 || pathParts[0] !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to delete this document'
        });
        return;
      }
      
      const propertyId = pathParts[1];
      
      // Check if the property exists and belongs to the user
      const property = await this.propertyService.getPropertyById(propertyId, userId);
      
      if (!property) {
        res.status(404).json({
          success: false,
          message: `Property with ID ${propertyId} not found or you don't have access to it`
        });
        return;
      }
      
      // Delete the document
      await this.documentService.deleteDocument(documentPath);
      
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting document',
        error: error.message
      });
    }
  }
} 