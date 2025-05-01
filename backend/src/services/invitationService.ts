import { Resend } from 'resend';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabase';

// Load environment variables
dotenv.config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_TRANSACTIONAL_KEY);
const fromEmail = process.env.RESEND_TRANSACTIONAL_EMAIL || 'noreply@yourdomain.com';

export interface InvitationData {
  propertyId: string;
  propertyName: string;
  ownerName: string;
  userEmail: string;
  userRole: string;
}

export class InvitationService {
  /**
   * Create a new invitation and send an email
   */
  async createInvitation(invitationData: InvitationData): Promise<string> {
    console.log(`[InvitationService] Creating invitation for ${invitationData.userEmail} to property ${invitationData.propertyId}`);
    
    // Generate a unique token for this invitation
    const token = uuidv4();
    
    // Store the invitation in the database
    const { data, error } = await supabaseAdmin
      .from('property_invitations')
      .insert([{
        property_id: invitationData.propertyId,
        email: invitationData.userEmail,
        role: invitationData.userRole,
        token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`[InvitationService] Error creating invitation: ${error.message}`);
      throw new Error(`Error creating invitation: ${error.message}`);
    }
    
    // Send the invitation email
    await this.sendInvitationEmail(invitationData, token);
    
    console.log(`[InvitationService] Invitation created successfully with token: ${token}`);
    return token;
  }

  /**
   * Send an invitation email using Resend
   */
  private async sendInvitationEmail(invitationData: InvitationData, token: string): Promise<void> {
    console.log(`[InvitationService] Sending invitation email to ${invitationData.userEmail}`);
    
    // Generate the acceptance URL (frontend will handle this route)
    const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${token}`;
    
    // Create the HTML email content with a button
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Property Invitation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Property Invitation</h2>
          </div>
          
          <p>Hello,</p>
          
          <p>${invitationData.ownerName} has invited you to join the property "${invitationData.propertyName}" as a ${invitationData.userRole}.</p>
          
          <p>Click the button below to accept this invitation:</p>
          
          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      // Send the email using Resend
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: invitationData.userEmail,
        subject: `Invitation to Property: ${invitationData.propertyName}`,
        html: htmlContent,
      });
      
      if (error) {
        console.error(`[InvitationService] Error sending invitation email: ${error}`);
        throw new Error(`Error sending invitation email: ${error}`);
      }
      
      console.log(`[InvitationService] Invitation email sent successfully, ID: ${data?.id}`);
    } catch (error: any) {
      console.error(`[InvitationService] Error sending invitation email: ${error.message}`);
      throw new Error(`Error sending invitation email: ${error.message}`);
    }
  }

  /**
   * Verify and accept an invitation
   */
  async acceptInvitation(token: string): Promise<{ propertyId: string, userId: string, role: string }> {
    console.log(`[InvitationService] Accepting invitation with token: ${token}`);
    
    // Find the invitation
    const { data: invitation, error: findError } = await supabaseAdmin
      .from('property_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (findError || !invitation) {
      console.error(`[InvitationService] Error finding invitation: ${findError?.message || 'Invitation not found or expired'}`);
      throw new Error(`Error finding invitation: ${findError?.message || 'Invitation not found or expired'}`);
    }
    
    // Find the user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .maybeSingle();
    
    if (userError || !user) {
      console.error(`[InvitationService] Error finding user: ${userError?.message || 'User not found'}`);
      throw new Error(`Error finding user: ${userError?.message || 'User not found'}`);
    }
    
    // Update the invitation status
    const { error: updateError } = await supabaseAdmin
      .from('property_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('token', token);
    
    if (updateError) {
      console.error(`[InvitationService] Error updating invitation: ${updateError.message}`);
      throw new Error(`Error updating invitation: ${updateError.message}`);
    }
    
    console.log(`[InvitationService] Invitation accepted successfully`);
    return {
      propertyId: invitation.property_id,
      userId: user.id,
      role: invitation.role
    };
  }
} 