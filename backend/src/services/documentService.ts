import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabaseAdmin } from './supabase';
import { PropertyService } from './propertyService';
import { Logger } from '../utils/loggerUtils';

export class DocumentService {
  private propertyService: PropertyService;
  private logger: Logger;
  
  constructor() {
    this.propertyService = new PropertyService();
    this.logger = new Logger('DocumentService');
  }
  
  /**
   * Validate property access and build storage path
   */
  private async validatePropertyAndBuildPath(
    userId: string, 
    propertyId: string, 
    documentType?: string
  ): Promise<string> {
    this.logger.methodStart('validatePropertyAndBuildPath', { 
      userId, 
      propertyId, 
      documentType 
    });
    
    // Check if the property exists and belongs to the user
    const property = await this.propertyService.getPropertyById(propertyId, userId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
    }
    
    // Build path: userId/propertyId/documents/documentType/
    let storagePath = `${userId}/${propertyId}/documents/`;
    
    if (documentType) {
      // Sanitize document type (remove spaces, special chars)
      const sanitizedDocType = documentType
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      storagePath += `${sanitizedDocType}/`;
    } else {
      // If no document type specified, use 'general' as folder
      storagePath += 'general/';
    }
    
    this.logger.info(`Built storage path: ${storagePath}`);
    return storagePath;
  }
  
  /**
   * Upload a document to Supabase Storage
   */
  async uploadDocument(
    fileBuffer: Buffer, 
    userId: string, 
    propertyId: string,
    documentType: string | undefined,
    originalFilename: string,
    mimeType: string
  ): Promise<string> {
    this.logger.methodStart('uploadDocument', { 
      userId, 
      propertyId, 
      documentType,
      originalFilename,
      mimeType,
      fileSize: fileBuffer.length
    });
    
    // Check if the bucket exists using service role client
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError || !buckets) {
      this.logger.error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
      throw new Error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'room-media');
    
    if (!bucketExists) {
      this.logger.error('Storage bucket "room-media" does not exist');
      throw new Error('Storage bucket "room-media" does not exist');
    }
    
    // Get the storage path with property validation
    const basePath = await this.validatePropertyAndBuildPath(userId, propertyId, documentType);
    
    // Keep original file extension
    const fileExt = path.extname(originalFilename);
    
    // Generate unique filename with timestamp but preserve extension
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const sanitizedName = path.basename(originalFilename, fileExt)
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-')
      .substring(0, 40); // Limit name length
      
    const filename = `${sanitizedName}-${timestamp}-${uniqueId}${fileExt}`;
    const fullPath = `${basePath}${filename}`;
    
    this.logger.info(`Uploading file to Supabase storage at: ${fullPath}`);
    
    // Upload the file to Supabase storage using service role client
    const { data, error } = await supabaseAdmin.storage
      .from('room-media')
      .upload(fullPath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });
    
    if (error) {
      this.logger.error(`Failed to upload to Supabase: ${error.message}`);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }
    
    this.logger.info(`File uploaded successfully at: ${data.path}`);
    return data.path;
  }
  
  /**
   * List all documents for a property
   */
  async listPropertyDocuments(userId: string, propertyId: string): Promise<any[]> {
    this.logger.methodStart('listPropertyDocuments', { userId, propertyId });
    
    // The base documents path: userId/propertyId/documents/
    const baseDocumentsPath = `${userId}/${propertyId}/documents`;
    
    // List all document type folders in the documents directory
    const { data: documentTypeFolders, error: foldersError } = await supabaseAdmin.storage
      .from('room-media')
      .list(baseDocumentsPath, {
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (foldersError) {
      this.logger.error(`Error listing document type folders: ${foldersError.message}`);
      throw new Error(`Failed to list document types: ${foldersError.message}`);
    }
    
    // Filter directories (document types)
    const filteredDocTypeFolders = documentTypeFolders || [];
    
    this.logger.info(`Found ${filteredDocTypeFolders.length} document type folders`);
    
    // Get documents for each document type
    const documentsGroupedByType = await Promise.all(
      filteredDocTypeFolders.map(async (folder) => {
        const documentType = folder.name;
        
        // Skip non-directory items
        // Supabase indicates directories with .metadata = null
        if (!folder || folder.metadata !== null) {
          return null;
        }
        
        // Full path to document type directory
        const docTypePath = `${baseDocumentsPath}/${documentType}`;
        
        this.logger.info(`Listing documents in: ${docTypePath}`);
        
        // List all files in the document type directory
        const { data: documentFiles, error: documentsError } = await supabaseAdmin.storage
          .from('room-media')
          .list(docTypePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (documentsError) {
          this.logger.error(`Error listing documents for type ${documentType}: ${documentsError.message}`);
          return {
            documentType,
            documents: []
          };
        }
        
        // Filter out directories
        const validDocumentFiles = documentFiles?.filter(file => file.metadata !== null) || [];
        
        this.logger.info(`Found ${validDocumentFiles.length} documents in ${documentType}`);
        
        // Generate URLs for each document
        const documents = await Promise.all(validDocumentFiles.map(async file => {
          const path = `${docTypePath}/${file.name}`;
          
          // Create a signed URL that expires in 1 day (86400 seconds)
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('room-media')
            .createSignedUrl(path, 86400);
          
          if (signedUrlError || !signedUrlData) {
            this.logger.error(`Error creating signed URL for ${path}: ${signedUrlError?.message}`);
            return null;
          }
          
          return {
            filename: file.name,
            path,
            url: signedUrlData.signedUrl,
            metadata: file.metadata,
            created_at: file.created_at
          };
        }));
        
        // Filter out null values (failed to create signed URLs)
        const validDocuments = documents.filter(doc => doc !== null);
        
        return {
          documentType,
          documents: validDocuments
        };
      })
    );
    
    // Filter out null values
    const result = documentsGroupedByType.filter(docType => docType !== null);
    this.logger.info(`Returning ${result.length} document categories`);
    
    return result;
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(documentPath: string): Promise<void> {
    this.logger.methodStart('deleteDocument', { documentPath });
    
    // Delete the file from Supabase storage
    const { error } = await supabaseAdmin.storage
      .from('room-media')
      .remove([documentPath]);
    
    if (error) {
      this.logger.error(`Failed to delete document: ${error.message}`);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
    
    this.logger.info(`Document deleted successfully: ${documentPath}`);
  }
} 