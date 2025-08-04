import { useState } from 'react';
import { useHandoutContext } from '@/lib/handout-context';
import { PDFService } from '@/lib/pdf-service';
import { notifications } from '@ganger/utils';

interface Patient {
  mrn: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

interface GenerationRequest {
  patient: Patient;
  templateIds: string[];
  deliveryOptions: {
    print: boolean;
    email: boolean;
    sms: boolean;
  };
}

export function useHandoutGenerator() {
  const { state, dispatch } = useHandoutContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHandouts = async (request: GenerationRequest) => {
    try {
      setIsGenerating(true);

      // Create generation record
      const generationId = `gen_${Date.now()}`;
      const generation = {
        id: generationId,
        patientMRN: request.patient.mrn,
        templateIds: request.templateIds,
        generatedAt: new Date().toISOString(),
        deliveryMethods: Object.keys(request.deliveryOptions).filter(
          key => request.deliveryOptions[key as keyof typeof request.deliveryOptions]
        ),
        status: 'generating' as const,
        deliveryStatus: {
          print: false,
          email: request.deliveryOptions.email ? 'pending' as const : undefined,
          sms: request.deliveryOptions.sms ? 'pending' as const : undefined
        }
      };

      dispatch({ type: 'START_GENERATION', payload: generation });

      // Step 1: Generate PDF
      notifications.show({
        type: 'info',
        title: 'Generating handouts...',
        message: 'Creating personalized PDF documents'
      });

      const pdfBlob = await PDFService.generateHandouts({
        patient: request.patient,
        templates: state.templates.filter(t => request.templateIds.includes(t.id)),
        formData: {}
      });

      // Step 2: Upload PDF to storage
      const pdfUrl = await PDFService.uploadPDF(pdfBlob, {
        patientMRN: request.patient.mrn,
        generationId
      });

      dispatch({ 
        type: 'COMPLETE_GENERATION', 
        payload: { id: generationId, pdfUrl } 
      });

      // Step 3: Handle delivery methods
      const deliveryPromises: Promise<void>[] = [];

      if (request.deliveryOptions.print) {
        // For print, just mark as ready
        deliveryPromises.push(
          Promise.resolve().then(() => {
            notifications.show({
              type: 'success',
              title: 'Ready for printing',
              message: 'Handouts are ready at the front desk printer'
            });
          })
        );
      }

      if (request.deliveryOptions.email && request.patient.email) {
        deliveryPromises.push(
          PDFService.sendEmail({
            to: request.patient.email,
            patientName: `${request.patient.firstName} ${request.patient.lastName}`,
            pdfUrl,
            templateCount: request.templateIds.length
          }).then(() => {
            dispatch({
              type: 'UPDATE_DELIVERY_STATUS',
              payload: { id: generationId, method: 'email', status: 'sent' }
            });
            notifications.show({
              type: 'success',
              title: 'Email sent',
              message: `Handouts sent to ${request.patient.email}`
            });
          }).catch(() => {
            dispatch({
              type: 'UPDATE_DELIVERY_STATUS',
              payload: { id: generationId, method: 'email', status: 'failed' }
            });
            notifications.show({
              type: 'error',
              title: 'Email failed',
              message: 'Failed to send email. Please try again.'
            });
          })
        );
      }

      if (request.deliveryOptions.sms && request.patient.phone) {
        deliveryPromises.push(
          PDFService.sendSMS({
            to: request.patient.phone,
            patientName: request.patient.firstName,
            downloadUrl: pdfUrl,
            templateCount: request.templateIds.length
          }).then(() => {
            dispatch({
              type: 'UPDATE_DELIVERY_STATUS',
              payload: { id: generationId, method: 'sms', status: 'sent' }
            });
            notifications.show({
              type: 'success',
              title: 'SMS sent',
              message: `Download link sent to ${request.patient.phone}`
            });
          }).catch(error => {
            dispatch({
              type: 'UPDATE_DELIVERY_STATUS',
              payload: { id: generationId, method: 'sms', status: 'failed' }
            });
            notifications.show({
              type: 'error',
              title: 'SMS failed',
              message: 'Failed to send text message. Please try again.'
            });
          })
        );
      }

      // Wait for all delivery methods to complete
      await Promise.allSettled(deliveryPromises);

      notifications.show({
        type: 'success',
        title: 'Handouts generated successfully',
        message: `Created ${request.templateIds.length} handout${request.templateIds.length !== 1 ? 's' : ''} for ${request.patient.firstName} ${request.patient.lastName}`
      });

    } catch (error) {
      
      if (state.currentGeneration) {
        dispatch({
          type: 'FAIL_GENERATION',
          payload: { id: state.currentGeneration.id, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }

      notifications.show({
        type: 'error',
        title: 'Generation failed',
        message: 'Failed to generate handouts. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateHandouts,
    isGenerating,
    currentGeneration: state.currentGeneration,
    recentHandouts: state.recentHandouts
  };
}