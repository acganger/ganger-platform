import { useState, useEffect } from 'react';
import { CallRecord, CallDashboardMetrics, DemoScenario } from '@/types';

export const useDemoData = () => {
  const [activeCalls, setActiveCalls] = useState<CallRecord[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [metrics, setMetrics] = useState<CallDashboardMetrics>({
    active_calls: 0,
    total_calls_today: 0,
    ai_resolution_rate: 0,
    average_call_duration: 0,
    patient_satisfaction: 0,
    calls_by_location: {},
    calls_by_status: {},
    recent_performance: {
      success_rate: 0,
      avg_confidence: 0,
      escalations: 0
    }
  });

  // Mock demo scenarios
  const demoScenarios: DemoScenario[] = [
    {
      id: 'scenario_1',
      name: 'Routine Appointment Scheduling',
      description: 'Patient calls to schedule a routine dermatology appointment',
      patient_name: 'Sarah M. Johnson',
      caller_phone: '+1 (734) 555-4821',
      scenario_type: 'appointment',
      location: 'Ann Arbor',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Thank you for calling Ganger Dermatology. This is our AI assistant. How may I help you today?",
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "Hi, I'd like to schedule an appointment for a skin check.",
          intent: 'appointment_scheduling',
          confidence: 0.92
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "I'd be happy to help you schedule a skin check appointment with Dr. Ganger. Can you please provide your name and date of birth for verification?"
        },
        {
          turn: 4,
          speaker: 'patient',
          text: "Sure, my name is Sarah Marie Johnson and my date of birth is March 15, 1985.",
          intent: 'personal_information',
          confidence: 0.98
        },
        {
          turn: 5,
          speaker: 'ai',
          text: "Thank you, Sarah. I found your account. Which location would work better for you - Ann Arbor or Wixom?"
        }
      ],
      expected_outcome: 'AI successfully schedules appointment without human intervention'
    },
    {
      id: 'scenario_2',
      name: 'Billing Inquiry - Account Balance',
      description: 'Patient calls to check their account balance and make a payment',
      patient_name: 'Michael T. Chen',
      caller_phone: '+1 (248) 555-7392',
      scenario_type: 'billing',
      location: 'Wixom',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Good afternoon! This is Ganger Dermatology's AI assistant. How may I help you today?"
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "Hi, I wanted to check my account balance and make a payment.",
          intent: 'billing_inquiry',
          confidence: 0.95
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "I can help you with that. For security, can you provide your name and date of birth?"
        },
        {
          turn: 4,
          speaker: 'patient',
          text: "Michael Chen, September 22, 1978.",
          intent: 'personal_information',
          confidence: 0.97
        }
      ],
      expected_outcome: 'AI provides balance and processes payment securely'
    },
    {
      id: 'scenario_3',
      name: 'Medical Question - Immediate Escalation',
      description: 'Patient has urgent medical concerns requiring immediate clinical attention',
      patient_name: 'Jennifer Martinez',
      caller_phone: '+15553456789',
      scenario_type: 'clinical',
      location: 'Plymouth',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Thank you for calling Ganger Dermatology. I'm your AI assistant. How can I help you today?"
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "I have a rash that appeared suddenly and it's spreading rapidly. I'm really worried.",
          intent: 'medical_question',
          confidence: 0.89,
          should_escalate: true
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "I understand your concern about the rash. This sounds like something our clinical team should address immediately. Let me connect you with one of our medical staff right away."
        }
      ],
      expected_outcome: 'AI immediately escalates to clinical staff for urgent medical assessment'
    },
    {
      id: 'scenario_4',
      name: 'Emergency Call - Chest Pain',
      description: 'Patient calls with potential medical emergency symptoms',
      patient_name: 'Robert Williams',
      caller_phone: '+15554567890',
      scenario_type: 'emergency',
      location: 'Ann Arbor',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Thank you for calling Ganger Dermatology. I'm your AI assistant. How can I help you today?"
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "I'm having chest pain and difficulty breathing. I just had a procedure done yesterday.",
          intent: 'emergency',
          confidence: 0.99,
          should_escalate: true
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "This sounds like a medical emergency. I'm immediately connecting you to our clinical team. Please stay on the line."
        }
      ],
      expected_outcome: 'AI triggers emergency protocol and immediate clinical transfer'
    },
    {
      id: 'scenario_5',
      name: 'Spanish Language Support',
      description: 'Spanish-speaking patient needs appointment scheduling assistance',
      patient_name: 'Maria Rodriguez',
      caller_phone: '+15555678901',
      scenario_type: 'multilingual',
      location: 'Wixom',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Thank you for calling Ganger Dermatology. I'm your AI assistant. How can I help you today?"
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "Hola, ¿habla español? Necesito hacer una cita.",
          intent: 'appointment_scheduling',
          confidence: 0.85
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "¡Hola! Sí, puedo ayudarle en español. Me gustaría conectarle con uno de nuestros representantes que habla español para ayudarle mejor."
        }
      ],
      expected_outcome: 'AI recognizes Spanish and transfers to bilingual staff member'
    },
    {
      id: 'scenario_6',
      name: '🏢 Employee Recognition - Dr. Ganger',
      description: 'Practice owner calls and is recognized by phone number with personalized greeting',
      patient_name: 'Dr. Anand Ganger',
      caller_phone: '+1 (734) 555-0101',
      scenario_type: 'employee_recognition',
      location: 'Ann Arbor',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Hi Anand! This is our AI assistant. How can I help you today?",
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "I need to check if Mrs. Patterson's biopsy results are ready.",
          intent: 'employee_request',
          confidence: 0.96
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "Of course! Let me check our lab results system for Mrs. Patterson's biopsy. I'll have that information for you in just a moment."
        },
        {
          turn: 4,
          speaker: 'patient',
          text: "Also, can you remind me what time my 3 PM appointment is scheduled for?",
          intent: 'schedule_inquiry',
          confidence: 0.98
        }
      ],
      expected_outcome: 'AI recognizes Dr. Ganger by phone number and provides personalized staff-level service'
    },
    {
      id: 'scenario_7',
      name: '🏢 Employee Recognition - Practice Manager',
      description: 'Practice manager calls and gets immediate recognition with appropriate access level',
      patient_name: 'Jessica Martinez',
      caller_phone: '+1 (248) 555-0103',
      scenario_type: 'employee_recognition',
      location: 'Wixom',
      conversation_script: [
        {
          turn: 1,
          speaker: 'ai',
          text: "Hello Jess! I recognize your number. How may I help you today?",
        },
        {
          turn: 2,
          speaker: 'patient',
          text: "I need to check our appointment availability for tomorrow at the Wixom location.",
          intent: 'staff_scheduling_inquiry',
          confidence: 0.94
        },
        {
          turn: 3,
          speaker: 'ai',
          text: "Absolutely! I can pull up the Wixom schedule for you. Let me check tomorrow's availability across all providers."
        }
      ],
      expected_outcome: 'AI recognizes practice manager and provides administrative-level access to scheduling information'
    }
  ];

  // Generate mock data
  useEffect(() => {
    const generateMockData = () => {
      // Generate active calls (including employee call for demo)
      const activeCallsData: CallRecord[] = [
        {
          id: 'call_001',
          call_id: '3cx_001',
          caller_phone: '+1 (734) 555-4821',
          caller_name: 'Sarah M. Johnson',
          patient_id: 'patient_001',
          call_direction: 'inbound',
          call_status: 'active',
          location: 'Ann Arbor',
          started_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          ai_handled: true,
          ai_confidence_score: 0.92,
          escalation_required: false,
          created_at: new Date(Date.now() - 180000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'call_002',
          call_id: '3cx_002',
          caller_phone: '+1 (734) 555-0102',
          caller_name: 'Sarah Williams, PA-C',
          patient_id: 'employee_002',
          call_direction: 'inbound',
          call_status: 'active',
          location: 'Ann Arbor',
          started_at: new Date(Date.now() - 90000).toISOString(), // 1.5 minutes ago
          ai_handled: true,
          ai_confidence_score: 0.98,
          escalation_required: false,
          created_at: new Date(Date.now() - 90000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Generate call history
      const historyData: CallRecord[] = [
        {
          id: 'call_003',
          call_id: '3cx_003',
          caller_phone: '+1 (734) 555-9841',
          caller_name: 'Jennifer L. Martinez',
          call_direction: 'inbound',
          call_status: 'transferred',
          location: 'Plymouth',
          started_at: new Date(Date.now() - 600000).toISOString(),
          ended_at: new Date(Date.now() - 480000).toISOString(),
          duration_seconds: 120,
          ai_handled: false,
          ai_confidence_score: 0.34,
          resolution_type: 'transferred',
          transfer_reason: 'Skin rash requiring clinical assessment',
          transferred_to: 'Dr. Sarah Williams, PA-C',
          escalation_required: true,
          patient_satisfaction_score: 5,
          quality_score: 95.5,
          created_at: new Date(Date.now() - 600000).toISOString(),
          updated_at: new Date(Date.now() - 480000).toISOString()
        },
        {
          id: 'call_004',
          call_id: '3cx_004',
          caller_phone: '+1 (248) 555-6273',
          caller_name: 'Lisa R. Park',
          call_direction: 'inbound',
          call_status: 'completed',
          location: 'Ann Arbor',
          started_at: new Date(Date.now() - 900000).toISOString(),
          ended_at: new Date(Date.now() - 720000).toISOString(),
          duration_seconds: 180,
          ai_handled: true,
          ai_confidence_score: 0.89,
          resolution_type: 'resolved',
          escalation_required: false,
          patient_satisfaction_score: 4,
          quality_score: 88.0,
          revenue_attributed: 150.00,
          created_at: new Date(Date.now() - 900000).toISOString(),
          updated_at: new Date(Date.now() - 720000).toISOString()
        },
        {
          id: 'call_005',
          call_id: '3cx_005',
          caller_phone: '+1 (734) 555-8147',
          caller_name: 'David A. Thompson',
          call_direction: 'inbound',
          call_status: 'completed',
          location: 'Wixom',
          started_at: new Date(Date.now() - 1200000).toISOString(),
          ended_at: new Date(Date.now() - 960000).toISOString(),
          duration_seconds: 240,
          ai_handled: true,
          ai_confidence_score: 0.95,
          resolution_type: 'resolved',
          escalation_required: false,
          patient_satisfaction_score: 5,
          quality_score: 92.5,
          revenue_attributed: 75.00,
          created_at: new Date(Date.now() - 1200000).toISOString(),
          updated_at: new Date(Date.now() - 960000).toISOString()
        }
      ];

      // Calculate metrics
      const allCalls = [...activeCallsData, ...historyData];
      const completedCalls = allCalls.filter(call => call.call_status === 'completed');
      const aiResolvedCalls = completedCalls.filter(call => call.ai_handled && call.resolution_type === 'resolved');
      
      const metricsData: CallDashboardMetrics = {
        active_calls: activeCallsData.length,
        total_calls_today: allCalls.length + 23, // Add some mock historical calls
        ai_resolution_rate: completedCalls.length > 0 ? Math.round((aiResolvedCalls.length / completedCalls.length) * 100) : 0,
        average_call_duration: completedCalls.length > 0 
          ? Math.round(completedCalls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / completedCalls.length)
          : 0,
        patient_satisfaction: completedCalls.length > 0
          ? Number((completedCalls.reduce((sum, call) => sum + (call.patient_satisfaction_score || 0), 0) / completedCalls.length).toFixed(1))
          : 0,
        calls_by_location: {
          'Ann Arbor': allCalls.filter(call => call.location === 'Ann Arbor').length + 8,
          'Wixom': allCalls.filter(call => call.location === 'Wixom').length + 6,
          'Plymouth': allCalls.filter(call => call.location === 'Plymouth').length + 4
        },
        calls_by_status: {
          'active': activeCallsData.length,
          'completed': allCalls.filter(call => call.call_status === 'completed').length + 18,
          'transferred': allCalls.filter(call => call.call_status === 'transferred').length + 3,
          'abandoned': 2
        },
        recent_performance: {
          success_rate: 87.5,
          avg_confidence: 0.84,
          escalations: 4
        }
      };

      setActiveCalls(activeCallsData);
      setCallHistory([...activeCallsData, ...historyData]);
      setMetrics(metricsData);
    };

    generateMockData();

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly update AI confidence scores and add new calls occasionally
      setActiveCalls(prev => prev.map(call => ({
        ...call,
        ai_confidence_score: Math.max(0.1, Math.min(1.0, (call.ai_confidence_score || 0.5) + (Math.random() - 0.5) * 0.1)),
        updated_at: new Date().toISOString()
      })));

      // Occasionally add a new call or complete an existing one
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const shouldAddCall = Math.random() < 0.7;
        
        if (shouldAddCall) {
          // Add new call
          const newCall: CallRecord = {
            id: `call_${Date.now()}`,
            call_id: `3cx_${Date.now()}`,
            caller_phone: `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
            caller_name: ['John Smith', 'Emily Davis', 'Carlos Rodriguez', 'Angela Kim'][Math.floor(Math.random() * 4)],
            call_direction: 'inbound',
            call_status: 'active',
            location: ['Ann Arbor', 'Wixom', 'Plymouth'][Math.floor(Math.random() * 3)] as any,
            started_at: new Date().toISOString(),
            ai_handled: true,
            ai_confidence_score: 0.7 + Math.random() * 0.3,
            escalation_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setActiveCalls(prev => [...prev, newCall]);
        } else {
          // Complete an existing call
          setActiveCalls(prev => {
            if (prev.length > 0) {
              const callToComplete = prev[Math.floor(Math.random() * prev.length)];
              if (!callToComplete) return prev;
              
              const completedCall = {
                ...callToComplete,
                call_status: 'completed' as any,
                ended_at: new Date().toISOString(),
                duration_seconds: Math.floor((Date.now() - new Date(callToComplete.started_at).getTime()) / 1000),
                resolution_type: 'resolved' as any,
                patient_satisfaction_score: 4 + Math.floor(Math.random() * 2)
              };
              
              setCallHistory(prevHistory => [completedCall, ...prevHistory]);
              return prev.filter(call => call.id !== callToComplete.id);
            }
            return prev;
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    activeCalls,
    callHistory,
    metrics,
    demoScenarios
  };
};