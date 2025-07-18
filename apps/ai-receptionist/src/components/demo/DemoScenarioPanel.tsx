import { useState } from 'react';
import { Button, Badge } from '@ganger/ui';
import { Card, Modal } from '@ganger/ui-catalyst';
import { DemoScenario } from '@/types';

interface DemoScenarioPanelProps {
  scenarios: DemoScenario[];
  onRunScenario: (scenario: DemoScenario) => void;
}

export const DemoScenarioPanel = ({ scenarios, onRunScenario }: DemoScenarioPanelProps) => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);

  const getScenarioTypeColor = (type: string) => {
    const colors = {
      appointment: 'bg-blue-100 text-blue-800',
      billing: 'bg-green-100 text-green-800',
      clinical: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800',
      multilingual: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const runScenario = async (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    setCurrentTurn(0);

    // Simulate conversation flow
    for (let i = 0; i < scenario.conversation_script.length; i++) {
      setCurrentTurn(i + 1);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between turns
    }

    setIsRunning(false);
    onRunScenario(scenario);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Demo Scenarios</h2>
        <Badge variant="outline">
          {scenarios.length} scenarios available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-slate-900 text-sm leading-tight">
                  {scenario.name}
                </h3>
                <Badge className={getScenarioTypeColor(scenario.scenario_type)}>
                  {scenario.scenario_type}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 mb-4 flex-1">
                {scenario.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-medium">{scenario.patient_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono text-xs">{scenario.caller_phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location:</span>
                  <span>{scenario.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Turns:</span>
                  <span>{scenario.conversation_script.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  View Script
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => runScenario(scenario)}
                  disabled={isRunning}
                >
                  {isRunning && selectedScenario?.id === scenario.id ? 'Running...' : 'Run Scenario'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Running Scenario Display */}
      {isRunning && selectedScenario && (
        <Card title={`Running: ${selectedScenario.name}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-900">{selectedScenario.patient_name}</h4>
                <p className="text-sm text-slate-600">{selectedScenario.caller_phone}</p>
              </div>
              <Badge className={getScenarioTypeColor(selectedScenario.scenario_type)}>
                Turn {currentTurn} / {selectedScenario.conversation_script.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {selectedScenario.conversation_script.slice(0, currentTurn).map((turn, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    turn.speaker === 'ai' 
                      ? 'bg-blue-50 border-ai-confident' 
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {turn.speaker === 'ai' ? '🤖 AI Assistant' : '👤 Patient'}
                    </span>
                    <div className="flex space-x-2">
                      {turn.intent && (
                        <Badge variant="outline" className="text-xs">
                          {turn.intent}
                        </Badge>
                      )}
                      {turn.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {(turn.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      )}
                      {turn.should_escalate && (
                        <Badge className="text-xs bg-orange-100 text-orange-800">
                          Escalation Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-900">{turn.text}</p>
                </div>
              ))}

              {currentTurn < selectedScenario.conversation_script.length && (
                <div className="p-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-slate-600">Processing next turn...</span>
                  </div>
                </div>
              )}
            </div>

            {currentTurn === selectedScenario.conversation_script.length && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Scenario Complete</h5>
                <p className="text-sm text-green-800">{selectedScenario.expected_outcome}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Scenario Detail Modal */}
      <Modal
        open={selectedScenario !== null && !isRunning}
        onClose={() => setSelectedScenario(null)}
      >
        {selectedScenario && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{selectedScenario.name}</h3>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Scenario Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Type:</span>
                  <Badge className={`ml-2 ${getScenarioTypeColor(selectedScenario.scenario_type)}`}>
                    {selectedScenario.scenario_type}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500">Location:</span>
                  <span className="ml-2 font-medium">{selectedScenario.location}</span>
                </div>
                <div>
                  <span className="text-slate-500">Patient:</span>
                  <span className="ml-2 font-medium">{selectedScenario.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <span className="ml-2 font-mono text-xs">{selectedScenario.caller_phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2">Description</h4>
              <p className="text-sm text-slate-600">{selectedScenario.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-2">Expected Outcome</h4>
              <p className="text-sm text-slate-600">{selectedScenario.expected_outcome}</p>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">Conversation Script</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedScenario.conversation_script.map((turn, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm border-l-4 ${
                      turn.speaker === 'ai' 
                        ? 'bg-blue-50 border-ai-confident' 
                        : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {turn.speaker === 'ai' ? '🤖 AI' : '👤 Patient'}
                      </span>
                      <div className="flex space-x-1">
                        {turn.intent && (
                          <Badge variant="outline" className="text-xs">
                            {turn.intent}
                          </Badge>
                        )}
                        {turn.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {(turn.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-900">{turn.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setSelectedScenario(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedScenario(null);
                  runScenario(selectedScenario);
                }}
              >
                Run This Scenario
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};