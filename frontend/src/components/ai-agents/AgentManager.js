import React, { useState, useEffect } from 'react';
import { createAgent, getAgents, updateAgentStatus } from '../../services/aiAgentService';
import AgentCard from './AgentCard';
import AgentCreator from './AgentCreator';
import SecurityMonitor from '../security/SecurityMonitor';

const AgentManager = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const agentList = await getAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleCreateAgent = async (taskDescription, agentType, capabilities) => {
    setLoading(true);
    try {
      const newAgent = await createAgent({
        task: taskDescription,
        type: agentType,
        capabilities: capabilities,
        region: getUserRegion()
      });
      setAgents(prev => [newAgent, ...prev]);
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (agentId, status) => {
    try {
      await updateAgentStatus(agentId, status);
      loadAgents();
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  return (
    <div className="agent-manager">
      <SecurityMonitor />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AgentCreator onCreateAgent={handleCreateAgent} loading={loading} />
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onStatusUpdate={handleUpdateStatus}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentManager;
