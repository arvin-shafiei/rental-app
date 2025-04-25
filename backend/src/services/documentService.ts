import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { supabaseAdmin } from './supabase';
import { PropertyService } from './propertyService';

export class DocumentService {
  private propertyService: PropertyService;
  
  constructor() {
    this.propertyService = new PropertyService();
  }
  
  /**
   * Validate property access and build storage path
   */
  private async validatePropertyAndBuildPath(
    userId: string, 
    propertyId: string, 
    documentType?: string
  ): Promise<string> {
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
    // Check if the bucket exists using service role client
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError || !buckets) {
      throw new Error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'room-media');
    
    if (!bucketExists) {
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
    
    // Upload the file to Supabase storage using service role client
    const { data, error } = await supabaseAdmin.storage
      .from('room-media')
      .upload(fullPath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });
    
    if (error) throw new Error(`Failed to upload to Supabase: ${error.message}`);
    
    return data.path;
  }
  
  /**
   * List all documents for a property
   */
  async listPropertyDocuments(userId: string, propertyId: string): Promise<any[]> {
    // The base documents path: userId/propertyId/documents/
    const baseDocumentsPath = `${userId}/${propertyId}/documents`;
    
    // List all document type folders in the documents directory
    const { data: documentTypeFolders, error: foldersError } = await supabaseAdmin.storage
      .from('room-media')
      .list(baseDocumentsPath, {
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (foldersError) {
      console.error('Error listing document type folders:', foldersError);
      throw new Error(`Failed to list document types: ${foldersError.message}`);
    }
    
    // Filter directories (document types)
    const filteredDocTypeFolders = documentTypeFolders || [];
    
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
        
        // List all files in the document type directory
        const { data: documentFiles, error: documentsError } = await supabaseAdmin.storage
          .from('room-media')
          .list(docTypePath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (documentsError) {
          console.error(`Error listing documents for type ${documentType}:`, documentsError);
          return {
            documentType,
            documents: []
          };
        }
        
        // Filter out directories
        const validDocumentFiles = documentFiles?.filter(file => file.metadata !== null) || [];
        
        // Generate URLs for each document
        const documents = await Promise.all(validDocumentFiles.map(async file => {
          const path = `${docTypePath}/${file.name}`;
          
          // Create a signed URL that expires in 1 day (86400 seconds)
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('room-media')
            .createSignedUrl(path, 86400);
          
          if (signedUrlError || !signedUrlData) {
            console.error(`Error creating signed URL for ${path}:`, signedUrlError);
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
    return documentsGroupedByType.filter(docType => docType !== null);
  }
  
  /**
   * Delete a document
   */
  async deleteDocument(documentPath: string): Promise<void> {
    // Delete the file from Supabase storage
    const { error } = await supabaseAdmin.storage
      .from('room-media')
      .remove([documentPath]);
    
    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
} 