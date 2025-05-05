import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

dotenv.config();

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_FILES_URL = 'https://api.openai.com/v1/files';

// Add this to your .env file: OPENAI_API_KEY=your_openai_api_key

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key is not defined in environment variables');
}

// Define interfaces for OpenAI API responses
interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIChoice {
  message: OpenAIMessage;
  finish_reason: string;
  index: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ContractAnalysisResult {
  contractType: string;
  parties: {
    landlord: {
      name: string;
      address: string;
    };
    tenant: {
      name: string;
      address: string;
    };
  };
  propertyDetails: {
    address: string;
    postcode: string;
  };
  terms: {
    startDate: string;
    endDate: string;
    rentAmount: string;
    depositAmount: string;
    paymentDue: string;
  };
  specialClauses: string[];
  issues: string[];
}

/**
 * Extract text from a document (PDF, DOCX, etc)
 */
export async function extractTextFromDocument(filePath: string): Promise<string> {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    console.log(`Extracting text from ${fileName} (${fileExtension})`);
    
    // Plain text files
    if (fileExtension === '.txt') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    // PDF files
    else if (fileExtension === '.pdf') {
      try {
        // Use pdf-parse to extract text from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        
        // data.text contains all the text content of the PDF
        return data.text;
      } catch (pdfError) {
        console.error('Error extracting PDF text:', pdfError);
        return `Failed to extract text from PDF: ${fileName}. Please check if the file is valid.`;
      }
    }
    // Word documents
    else if (fileExtension === '.doc' || fileExtension === '.docx') {
      try {
        console.log(`Extracting text from Word document: ${fileName}`);
        const result = await mammoth.extractRawText({ path: filePath });
        
        if (result.value) {
          console.log(`Successfully extracted ${result.value.length} characters from ${fileName}`);
          return result.value;
        } else {
          console.warn(`Extracted empty text from Word document: ${fileName}`);
          // If the extraction returned empty content but didn't throw an error
          return `No text content found in Word document: ${fileName}. The file might be corrupt, password-protected, or in an unsupported format.`;
        }
      } catch (docError: any) {
        console.error('Error extracting Word document text:', docError);
        return `Failed to extract text from document: ${fileName}. Error: ${docError.message || 'Unknown error'}`;
      }
    }
    // Unsupported file type
    else {
      return `This file type (${fileExtension}) is not supported for text extraction.`;
    }
  } catch (error) {
    console.error('Error extracting text from document:', error);
    return `Failed to extract text from document. Please try with a different file.`;
  }
}

/**
 * Analyze a contract using OpenAI API
 */
export async function analyzeContract(filePath: string | Buffer): Promise<ContractAnalysisResult> {
  try {
    console.log('Starting contract analysis with OpenAI API...');
    
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key is required for contract analysis');
    }

    // Extract text from document first
    let documentText = '';
    if (typeof filePath === 'string') {
      documentText = await extractTextFromDocument(filePath);
    } else {
      // If we have a buffer, write it to a temp file and extract text
      try {
        // Get the file extension from the data signature if possible
        // This is a simple check - in a real app you would use something like file-type
        let extension = '.bin';
        const fileSignature = filePath.slice(0, 4).toString('hex');
        
        // Check file signature to determine file type
        if (fileSignature.startsWith('504b')) {
          extension = '.docx'; // Office Open XML format (DOCX)
        } else if (fileSignature.startsWith('d0cf')) {
          extension = '.doc';  // Old Word Document
        } else if (fileSignature.startsWith('2550')) {
          extension = '.pdf';  // PDF file
        } else if (fileSignature.startsWith('7b0a')) {
          extension = '.txt';  // Text file starting with '{\n'
        }
        
        console.log(`Detected file type: ${extension} based on signature`);
        
        // Create temp file with the correct extension
        const tempFilePath = path.join('uploads', 'temp', `temp_doc_${Date.now()}${extension}`);
        
        // Ensure the temp directory exists
        const tempDir = path.join('uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, filePath);
        console.log(`Temporary file written to: ${tempFilePath}`);
        
        // Extract text using the correct file type handler
        documentText = await extractTextFromDocument(tempFilePath);
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
      } catch (tempFileError) {
        console.error('Error processing buffer:', tempFileError);
        throw new Error('Failed to process document buffer');
      }
    }
    
    // Create the prompt for contract analysis
    const systemPrompt = 'You are an expert in rental contracts and tenant rights. Your job is to analyze rental agreements and identify key information and potential issues for tenants.';
    
    const userPrompt = `
    Analyze this rental contract/lease agreement and extract key information.
    Also identify any potential issues, unfair terms, or areas that could be problematic for the tenant.
    
    Here is the contract text:
    ${documentText}
    
    Please structure your response in JSON format with the following fields:
    - contractType: The type of rental agreement
    - parties: Object with landlord and tenant information, each containing name and address fields
    - propertyDetails: Object with address and postcode
    - terms: Object with startDate, endDate, rentAmount, depositAmount, and paymentDue
    - specialClauses: Array of any notable or special clauses
    - issues: Array of potential issues, unfair terms or areas of concern for the tenant
    `;
    
    // Call OpenAI API with extracted text
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2  // Lower temperature for more consistent results
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: { message?: string } };
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected response format from OpenAI:', data);
      throw new Error('Invalid response format from OpenAI API');
    }
    
    const analysisText = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    try {
      // Sometimes GPT might wrap the JSON in markdown code blocks, so we need to extract it
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         analysisText.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      const analysis = JSON.parse(jsonText) as ContractAnalysisResult;
      
      return analysis;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.log('Raw response:', analysisText);
      
      // If parsing fails, return a default structured response
      return {
        contractType: 'Unknown Contract Type',
        parties: {
          landlord: {
            name: 'Could not extract landlord information',
            address: 'Could not extract landlord address'
          },
          tenant: {
            name: 'Could not extract tenant information',
            address: 'Could not extract tenant address'
          }
        },
        propertyDetails: {
          address: 'Could not extract address',
          postcode: 'Could not extract postcode'
        },
        terms: {
          startDate: 'Unknown',
          endDate: 'Unknown',
          rentAmount: 'Unknown',
          depositAmount: 'Unknown',
          paymentDue: 'Unknown'
        },
        specialClauses: ['Could not extract special clauses'],
        issues: ['Error processing contract', 'Please try again or contact support']
      };
    }
  } catch (error) {
    console.error('Error in contract analysis:', error);
    throw error;
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(extension: string): string {
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
    case '.docx':
      return 'application/msword';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
} 