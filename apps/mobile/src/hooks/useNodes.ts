import { useState, useEffect, useCallback } from 'react';
import { Node, LoadingState } from '../types';
import { apiClient } from '../utils/api';
import { webSocketService } from '../services/websocket';

export const useNodes = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, error: null });

  const fetchNodes = useCallback(async () => {
    setLoading({ isLoading: true, error: null });

    try {
      const response = await apiClient.getNodes();
      if (response.success && response.data) {
        setNodes(response.data);
      } else {
        setLoading({ isLoading: false, error: response.error || 'Failed to fetch nodes' });
      }
    } catch (error) {
      setLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const createNode = useCallback(async (nodeData: Partial<Node>) => {
    try {
      const response = await apiClient.createNode(nodeData);
      if (response.success && response.data) {
        setNodes(prev => [...prev, response.data!]);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create node'
      };
    }
  }, []);

  const updateNode = useCallback(async (nodeId: string, nodeData: Partial<Node>) => {
    try {
      const response = await apiClient.updateNode(nodeId, nodeData);
      if (response.success && response.data) {
        setNodes(prev =>
          prev.map(node =>
            node.id === nodeId ? { ...node, ...response.data } : node
          )
        );
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update node'
      };
    }
  }, []);

  const deleteNode = useCallback(async (nodeId: string) => {
    try {
      const response = await apiClient.deleteNode(nodeId);
      if (response.success) {
        setNodes(prev => prev.filter(node => node.id !== nodeId));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete node'
      };
    }
  }, []);

  const refreshNodes = useCallback(() => {
    fetchNodes();
  }, [fetchNodes]);

  // WebSocket real-time updates
  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('node_update', (data: Partial<Node> & { id: string }) => {
      setNodes(prev =>
        prev.map(node =>
          node.id === data.id ? { ...node, ...data } : node
        )
      );
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter(node => node.status === 'online').length;
  const offlineNodes = nodes.filter(node => node.status === 'offline').length;
  const totalEarnings = nodes.reduce((sum, node) => sum + node.earnings.total, 0);
  const dailyEarnings = nodes.reduce((sum, node) => sum + node.earnings.daily, 0);

  return {
    nodes,
    loading,
    totalNodes,
    onlineNodes,
    offlineNodes,
    totalEarnings,
    dailyEarnings,
    createNode,
    updateNode,
    deleteNode,
    refreshNodes,
  };
};