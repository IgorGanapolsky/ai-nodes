import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { NodeCard } from '../components/NodeCard';
import { useNodes } from '../hooks/useNodes';
const NodesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newNode, setNewNode] = useState({
    name: '',
    type: 'GPU',
    location: '',
  });
  const {
    nodes,
    loading,
    totalNodes,
    onlineNodes,
    offlineNodes,
    createNode,
    updateNode,
    deleteNode,
    refreshNodes,
  } = useNodes();
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNodes();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };
  const handleAddNode = async () => {
    if (!newNode.name.trim() || !newNode.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const result = await createNode({
      name: newNode.name.trim(),
      type: newNode.type,
      location: newNode.location.trim(),
      status: 'offline',
      earnings: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0,
      },
      metrics: {
        uptime: 0,
        performance: 0,
        utilization: 0,
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
    if (result.success) {
      setShowAddModal(false);
      setNewNode({ name: '', type: 'GPU', location: '' });
      Alert.alert('Success', 'Node added successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to add node');
    }
  };
  const handleDeleteNode = (node) => {
    Alert.alert(
      'Delete Node',
      `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteNode(node.id);
            if (result.success) {
              Alert.alert('Success', 'Node deleted successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete node');
            }
          },
        },
      ],
    );
  };
  const filteredNodes = nodes.filter((node) => {
    if (filterStatus === 'all') {return true;}
    return node.status === filterStatus;
  });
  const maintenanceNodes = nodes.filter((node) => node.status === 'maintenance').length;
  if (loading.isLoading && nodes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading nodes...</Text>
      </View>
    );
  }
  if (loading.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to Load Nodes</Text>
        <Text style={styles.errorText}>{loading.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerContainer}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalNodes}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{onlineNodes}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{offlineNodes}</Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{maintenanceNodes}</Text>
            <Text style={styles.statLabel}>Maintenance</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Node</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'online', label: 'Online' },
          { key: 'offline', label: 'Offline' },
          { key: 'maintenance', label: 'Maintenance' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterButton, filterStatus === filter.key && styles.filterButtonActive]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nodes List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredNodes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filterStatus === 'all' ? 'No nodes found' : `No ${filterStatus} nodes`}
            </Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'all'
                ? 'Add your first node to get started'
                : 'Try changing the filter or refresh the list'}
            </Text>
          </View>
        ) : (
          filteredNodes.map((node) => (
            <View key={node.id} style={styles.nodeContainer}>
              <NodeCard
                node={node}
                onPress={() => {
                  // Show node details/actions
                  Alert.alert(node.name, 'Node Actions', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Edit',
                      onPress: () => {
                        // TODO: Implement edit functionality
                        console.log('Edit node:', node.id);
                      },
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDeleteNode(node),
                    },
                  ]);
                }}
              />
              <View style={styles.nodeActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit node:', node.id);
                  }}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteNode(node)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Node Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Node</Text>
            <TouchableOpacity onPress={handleAddNode}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Node Name *</Text>
              <TextInput
                style={styles.formInput}
                value={newNode.name}
                onChangeText={(text) => setNewNode((prev) => ({ ...prev, name: text }))}
                placeholder="Enter node name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Node Type *</Text>
              <View style={styles.typeSelector}>
                {['GPU', 'CPU', 'STORAGE'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, newNode.type === type && styles.typeButtonActive]}
                    onPress={() => setNewNode((prev) => ({ ...prev, type }))}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        newNode.type === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.formInput}
                value={newNode.location}
                onChangeText={(text) => setNewNode((prev) => ({ ...prev, location: text }))}
                placeholder="e.g., US East, Europe West"
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.formNote}>
              * Required fields. New nodes will start in offline status and need to be configured
              separately.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  nodeContainer: {
    marginBottom: 8,
  },
  nodeActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: -8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  formNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
export default NodesScreen;
