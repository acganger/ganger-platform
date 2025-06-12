// Phone Verification Service for AI Receptionist
// Validates caller identity using SMS challenge words

import { ZenefitsEmployee } from '@/types';

interface VerificationChallenge {
  id: string;
  employee_id: string;
  phone_number: string;
  challenge_word: string;
  sent_at: Date;
  expires_at: Date;
  verified: boolean;
  attempts: number;
  max_attempts: number;
}

interface SMSResult {
  success: boolean;
  message_sid?: string;
  error?: string;
}

export class PhoneVerificationService {
  private challenges: Map<string, VerificationChallenge> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  private readonly EXPIRY_MINUTES = 5;

  // Medical challenge words from the CSV
  private readonly challengeWords = [
    'Melanoma', 'Dermatitis', 'Psoriasis', 'Eczema', 'Biopsy', 'Carcinoma',
    'Vitiligo', 'Rosacea', 'Actinic', 'Seborrheic', 'Botulinum', 'Melanin',
    'Keratin', 'Epidermis', 'Dermis', 'Lesion', 'Nodule', 'Papule',
    'Vesicle', 'Pustule', 'Macule', 'Patch', 'Plaque', 'Wheal',
    'Erythema', 'Pruritus', 'Alopecia', 'Cellulitis', 'Folliculitis'
  ];

  constructor() {
    // Clean up expired challenges every 5 minutes
    setInterval(() => this.cleanupExpiredChallenges(), 5 * 60 * 1000);
  }

  /**
   * Get random challenge word
   */
  private getRandomChallengeWord(): string {
    const randomIndex = Math.floor(Math.random() * this.challengeWords.length);
    return this.challengeWords[randomIndex];
  }

  /**
   * Generate unique challenge ID
   */
  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send SMS using Twilio (mock implementation for demo)
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // In production, this would use the actual Twilio integration
      // For demo, we'll simulate the SMS send
      console.log(`📱 SMS Simulation - TO: ${phoneNumber}`);
      console.log(`📱 SMS Simulation - MESSAGE: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate successful SMS
      return {
        success: true,
        message_sid: `SM${Math.random().toString(36).substr(2, 32)}`
      };

      /* Production implementation would be:
      const twilioConfig = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_PHONE_NUMBER
      };

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: twilioConfig.fromNumber,
          To: phoneNumber,
          Body: message
        })
      });

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message_sid: data.sid
      };
      */

    } catch (error) {
      console.error('SMS send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initiate phone verification for an employee
   */
  async initiateVerification(employee: ZenefitsEmployee, phoneNumber: string): Promise<{
    success: boolean;
    challenge_id: string;
    expires_in_minutes: number;
    error?: string;
  }> {
    try {
      // Check if there's already an active challenge for this employee
      const existingChallengeId = Array.from(this.challenges.entries())
        .find(([_, challenge]) => 
          challenge.employee_id === employee.id && 
          challenge.phone_number === phoneNumber &&
          !challenge.verified &&
          challenge.expires_at > new Date()
        )?.[0];

      if (existingChallengeId) {
        const existingChallenge = this.challenges.get(existingChallengeId)!;
        return {
          success: false,
          challenge_id: existingChallengeId,
          expires_in_minutes: Math.ceil((existingChallenge.expires_at.getTime() - Date.now()) / (1000 * 60)),
          error: 'Verification already in progress. Please complete the current challenge or wait for it to expire.'
        };
      }

      // Generate new challenge
      const challengeId = this.generateChallengeId();
      const challengeWord = this.getRandomChallengeWord();
      const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

      const challenge: VerificationChallenge = {
        id: challengeId,
        employee_id: employee.id,
        phone_number: phoneNumber,
        challenge_word: challengeWord,
        sent_at: new Date(),
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
        max_attempts: this.MAX_ATTEMPTS
      };

      // Send SMS with challenge word
      const smsMessage = `Ganger Dermatology Identity Verification\n\nTo verify your identity, please say this word to our AI assistant: "${challengeWord}"\n\nThis code expires in ${this.EXPIRY_MINUTES} minutes.`;
      
      const smsResult = await this.sendSMS(phoneNumber, smsMessage);
      
      if (!smsResult.success) {
        return {
          success: false,
          challenge_id: challengeId,
          expires_in_minutes: this.EXPIRY_MINUTES,
          error: `Failed to send verification SMS: ${smsResult.error}`
        };
      }

      // Store challenge
      this.challenges.set(challengeId, challenge);

      console.log(`🔐 Verification initiated for ${employee.first_name} ${employee.last_name}`);
      console.log(`📱 Challenge word: ${challengeWord} sent to ${phoneNumber}`);

      return {
        success: true,
        challenge_id: challengeId,
        expires_in_minutes: this.EXPIRY_MINUTES
      };

    } catch (error) {
      console.error('Verification initiation failed:', error);
      return {
        success: false,
        challenge_id: '',
        expires_in_minutes: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify the spoken challenge word
   */
  async verifyChallenge(challengeId: string, spokenWord: string): Promise<{
    success: boolean;
    verified: boolean;
    attempts_remaining: number;
    error?: string;
  }> {
    try {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) {
        return {
          success: false,
          verified: false,
          attempts_remaining: 0,
          error: 'Invalid or expired verification challenge'
        };
      }

      // Check if challenge has expired
      if (challenge.expires_at < new Date()) {
        this.challenges.delete(challengeId);
        return {
          success: false,
          verified: false,
          attempts_remaining: 0,
          error: 'Verification challenge has expired. Please request a new one.'
        };
      }

      // Check if already verified
      if (challenge.verified) {
        return {
          success: true,
          verified: true,
          attempts_remaining: challenge.max_attempts - challenge.attempts,
          error: 'Already verified'
        };
      }

      // Increment attempts
      challenge.attempts++;

      // Normalize both words for comparison (case-insensitive, trim whitespace)
      const normalizedSpoken = spokenWord.toLowerCase().trim();
      const normalizedChallenge = challenge.challenge_word.toLowerCase().trim();

      if (normalizedSpoken === normalizedChallenge) {
        // Verification successful
        challenge.verified = true;
        console.log(`✅ Verification successful for challenge ${challengeId}`);
        
        return {
          success: true,
          verified: true,
          attempts_remaining: challenge.max_attempts - challenge.attempts
        };
      } else {
        // Verification failed
        const attemptsRemaining = challenge.max_attempts - challenge.attempts;
        
        if (attemptsRemaining <= 0) {
          // Max attempts reached, remove challenge
          this.challenges.delete(challengeId);
          console.log(`❌ Verification failed - max attempts reached for challenge ${challengeId}`);
          
          return {
            success: false,
            verified: false,
            attempts_remaining: 0,
            error: 'Maximum verification attempts reached. Please request a new verification.'
          };
        }

        console.log(`❌ Verification failed for challenge ${challengeId}. ${attemptsRemaining} attempts remaining.`);
        
        return {
          success: true,
          verified: false,
          attempts_remaining: attemptsRemaining,
          error: `Incorrect word. You have ${attemptsRemaining} attempts remaining.`
        };
      }

    } catch (error) {
      console.error('Challenge verification failed:', error);
      return {
        success: false,
        verified: false,
        attempts_remaining: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get challenge status
   */
  getChallengeStatus(challengeId: string): {
    exists: boolean;
    verified: boolean;
    expired: boolean;
    attempts_remaining: number;
    challenge_word?: string; // For demo purposes only
  } {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      return {
        exists: false,
        verified: false,
        expired: true,
        attempts_remaining: 0
      };
    }

    const isExpired = challenge.expires_at < new Date();
    
    return {
      exists: true,
      verified: challenge.verified,
      expired: isExpired,
      attempts_remaining: challenge.max_attempts - challenge.attempts,
      challenge_word: challenge.challenge_word // For demo only - remove in production
    };
  }

  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.expires_at < now) {
        this.challenges.delete(challengeId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired verification challenges`);
    }
  }

  /**
   * Get verification statistics (for admin/debugging)
   */
  getVerificationStats(): {
    active_challenges: number;
    verified_challenges: number;
    expired_challenges: number;
  } {
    const now = new Date();
    let active = 0;
    let verified = 0;
    let expired = 0;

    for (const challenge of this.challenges.values()) {
      if (challenge.expires_at < now) {
        expired++;
      } else if (challenge.verified) {
        verified++;
      } else {
        active++;
      }
    }

    return {
      active_challenges: active,
      verified_challenges: verified,
      expired_challenges: expired
    };
  }
}

// Export singleton instance
export const phoneVerificationService = new PhoneVerificationService();