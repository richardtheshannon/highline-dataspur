'use client'

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  name: string | null
  email: string | null
  role: 'ADMIN' | 'USER' | 'VIEWER'
  createdAt: string
  updatedAt: string
}

interface CreateUserData {
  name: string
  email: string
  role: 'ADMIN' | 'USER' | 'VIEWER'
}

interface EditUserData extends CreateUserData {
  resetPassword?: boolean
  newPassword?: string
}

type SortField = 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [deleteConfirming, setDeleteConfirming] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    role: 'USER'
  })

  // Enhanced edit form state
  const [editFormData, setEditFormData] = useState<EditUserData>({
    name: '',
    email: '',
    role: 'USER',
    resetPassword: false,
    newPassword: ''
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setError(null)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handle responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Add event listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const filteredUsers = sortedUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (user.name?.toLowerCase().includes(searchLower) || false) ||
      (user.email?.toLowerCase().includes(searchLower) || false) ||
      user.role.toLowerCase().includes(searchLower)
    )
  })

  const openCreateModal = () => {
    setModalMode('create')
    setFormData({ name: '', email: '', role: 'USER' })
    setEditingUser(null)
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setModalMode('edit')
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role
    })
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      resetPassword: false,
      newPassword: ''
    })
    setEditingUser(user)
    setShowModal(true)
  }

  const openUserDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'USER' })
    setEditFormData({ name: '', email: '', role: 'USER', resetPassword: false, newPassword: '' })
  }

  const closeUserDetails = () => {
    setShowUserDetails(false)
    setSelectedUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = modalMode === 'create' ? '/api/users' : `/api/users/${editingUser?.id}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'
      
      // Use editFormData for edit mode to include password reset functionality
      const requestData = modalMode === 'create' ? formData : editFormData
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        await fetchUsers()
        closeModal()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save user')
      }
    } catch (err) {
      setError('Error saving user')
      console.error('Error saving user:', err)
    }
  }

  const handleDelete = async (userId: string) => {
    if (deleteConfirming === userId) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchUsers()
          setDeleteConfirming(null)
        } else {
          setError('Failed to delete user')
        }
      } catch (err) {
        setError('Error deleting user')
        console.error('Error deleting user:', err)
      }
    } else {
      setDeleteConfirming(userId)
      setTimeout(() => setDeleteConfirming(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'role-admin'
      case 'USER': return 'role-user'
      case 'VIEWER': return 'role-viewer'
      default: return 'role-user'
    }
  }

  if (loading) {
    return (
      <div className="safe-margin">
        <div className="create-project-container">
          <div className="loading-state">
            <span className="material-symbols-outlined loading-icon">hourglass_empty</span>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="safe-margin">
        <div className="create-project-container">
          {/* Header */}
          <div className="create-project-header">
            <div className="create-project-title-section">
              <h1 className="create-project-title">User Management</h1>
              <p className="create-project-subtitle">
                Manage application users, roles, and permissions
              </p>
            </div>
            <button 
              className="form-btn form-btn-primary"
              onClick={openCreateModal}
            >
              <span className="material-symbols-outlined">person_add</span>
              Add New User
            </button>
          </div>

          {error && (
            <div className="create-project-error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {/* Statistics */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="material-symbols-outlined">analytics</span>
              User Statistics
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{users.filter(u => u.role === 'ADMIN').length}</div>
                <div className="stat-label">Administrators</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{users.filter(u => u.role === 'USER').length}</div>
                <div className="stat-label">Standard Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{users.filter(u => u.role === 'VIEWER').length}</div>
                <div className="stat-label">Viewers</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="material-symbols-outlined">search</span>
              Search & Filter
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="material-symbols-outlined">people</span>
              Users ({filteredUsers.length})
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">people_outline</span>
                <h3>No users found</h3>
                <p>No users match your search criteria.</p>
              </div>
            ) : isMobile ? (
              /* Mobile Card View */
              <div className="users-cards-container">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-card-header">
                      <div className="user-card-info">
                        <div className="user-card-avatar">
                          <span className="material-symbols-outlined">account_circle</span>
                        </div>
                        <div className="user-card-details">
                          <h3 className="user-card-name">{user.name || 'No name'}</h3>
                          <p className="user-card-email">{user.email}</p>
                          <span className={`role-badge ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div className="user-card-actions">
                        <button
                          className="action-btn action-btn-view"
                          onClick={() => openUserDetails(user)}
                          title="View user details"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          className="action-btn action-btn-edit"
                          onClick={() => openEditModal(user)}
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className={`action-btn ${deleteConfirming === user.id ? 'action-btn-delete-confirm' : 'action-btn-delete'}`}
                          onClick={() => handleDelete(user.id)}
                          title={deleteConfirming === user.id ? 'Click again to confirm' : 'Delete user'}
                        >
                          <span className="material-symbols-outlined">
                            {deleteConfirming === user.id ? 'warning' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="user-card-meta">
                      <div className="user-card-meta-item">
                        <span className="material-symbols-outlined">calendar_add_on</span>
                        <span>Created {formatDate(user.createdAt)}</span>
                      </div>
                      <div className="user-card-meta-item">
                        <span className="material-symbols-outlined">update</span>
                        <span>Updated {formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th 
                        onClick={() => handleSort('name')}
                        className="sortable-header"
                      >
                        Name
                        <span className="material-symbols-outlined">
                          {sortField === 'name' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSort('email')}
                        className="sortable-header"
                      >
                        Email
                        <span className="material-symbols-outlined">
                          {sortField === 'email' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
                        </span>
                      </th>
                      <th 
                        onClick={() => handleSort('role')}
                        className="sortable-header"
                      >
                        Role
                        <span className="material-symbols-outlined">
                          {sortField === 'role' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
                        </span>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <span className="material-symbols-outlined user-avatar">account_circle</span>
                            <span className="user-name">{user.name || 'No name'}</span>
                          </div>
                        </td>
                        <td className="user-email">{user.email}</td>
                        <td>
                          <span className={`role-badge ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn action-btn-view"
                              onClick={() => openUserDetails(user)}
                              title="View user details"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button
                              className="action-btn action-btn-edit"
                              onClick={() => openEditModal(user)}
                              title="Edit user"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className={`action-btn ${deleteConfirming === user.id ? 'action-btn-delete-confirm' : 'action-btn-delete'}`}
                              onClick={() => handleDelete(user.id)}
                              title={deleteConfirming === user.id ? 'Click again to confirm' : 'Delete user'}
                            >
                              <span className="material-symbols-outlined">
                                {deleteConfirming === user.id ? 'warning' : 'delete'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <>
          <div 
            className="modal-backdrop"
            onClick={closeModal}
          />
          <div className="user-modal user-management-modal">
            <div className="user-modal-header">
              <div className="modal-header-left">
                <h2>{modalMode === 'create' ? 'Add New User' : 'Edit User'}</h2>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="user-modal-content">
              <form onSubmit={handleSubmit} className="user-form">
                {modalMode === 'create' ? (
                  <>
                    <div className="form-field">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="role" className="form-label">User Role</label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' | 'VIEWER' })}
                        className="form-input"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-field">
                      <label htmlFor="edit-name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="edit-email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="edit-email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="edit-role" className="form-label">User Role</label>
                      <select
                        id="edit-role"
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'ADMIN' | 'USER' | 'VIEWER' })}
                        className="form-input"
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>

                    <div className="form-section">
                      <div className="form-section-title">
                        <span className="material-symbols-outlined">lock_reset</span>
                        Password Management
                      </div>
                      
                      <div className="form-field">
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={editFormData.resetPassword}
                            onChange={(e) => setEditFormData({ 
                              ...editFormData, 
                              resetPassword: e.target.checked,
                              newPassword: e.target.checked ? '' : editFormData.newPassword
                            })}
                          />
                          <span className="checkbox-label">Reset user password</span>
                        </label>
                      </div>

                      {editFormData.resetPassword && (
                        <div className="form-field">
                          <label htmlFor="new-password" className="form-label">New Password</label>
                          <input
                            type="password"
                            id="new-password"
                            value={editFormData.newPassword}
                            onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                            className="form-input"
                            placeholder="Enter new password"
                            minLength={6}
                            required
                          />
                          <small className="form-help">Minimum 6 characters required</small>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div className="form-actions">
                  <button type="button" onClick={closeModal} className="form-btn form-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="form-btn form-btn-primary">
                    {modalMode === 'create' ? 'Create User' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <>
          <div 
            className="modal-backdrop"
            onClick={closeUserDetails}
          />
          <div className="user-modal user-details-modal">
            <div className="user-modal-header">
              <div className="modal-header-left">
                <h2>User Details</h2>
              </div>
              <button className="modal-close" onClick={closeUserDetails}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="user-modal-content">
              <div className="user-details-container">
                {/* User Profile Section */}
                <div className="user-details-section">
                  <div className="user-details-header">
                    <div className="user-avatar-large">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <div className="user-info-large">
                      <h3>{selectedUser.name || 'No name'}</h3>
                      <p className="user-email-large">{selectedUser.email}</p>
                      <span className={`role-badge ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="user-details-grid">
                  <div className="detail-card">
                    <div className="detail-icon">
                      <span className="material-symbols-outlined">badge</span>
                    </div>
                    <div className="detail-content">
                      <h4>User ID</h4>
                      <p>{selectedUser.id}</p>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-icon">
                      <span className="material-symbols-outlined">calendar_add_on</span>
                    </div>
                    <div className="detail-content">
                      <h4>Account Created</h4>
                      <p>{formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-icon">
                      <span className="material-symbols-outlined">update</span>
                    </div>
                    <div className="detail-content">
                      <h4>Last Updated</h4>
                      <p>{formatDate(selectedUser.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="detail-card">
                    <div className="detail-icon">
                      <span className="material-symbols-outlined">security</span>
                    </div>
                    <div className="detail-content">
                      <h4>Access Level</h4>
                      <p>{selectedUser.role === 'ADMIN' ? 'Full Administrative Access' : 
                         selectedUser.role === 'USER' ? 'Standard User Access' : 
                         'View-Only Access'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="user-details-actions">
                  <h4>Quick Actions</h4>
                  <div className="quick-actions-grid">
                    <button 
                      className="quick-action-btn"
                      onClick={() => {
                        closeUserDetails()
                        openEditModal(selectedUser)
                      }}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      Edit User
                    </button>
                    <button 
                      className="quick-action-btn"
                      onClick={() => {
                        closeUserDetails()
                        setEditFormData({
                          name: selectedUser.name || '',
                          email: selectedUser.email || '',
                          role: selectedUser.role,
                          resetPassword: true,
                          newPassword: ''
                        })
                        setModalMode('edit')
                        setEditingUser(selectedUser)
                        setShowModal(true)
                      }}
                    >
                      <span className="material-symbols-outlined">lock_reset</span>
                      Reset Password
                    </button>
                    <button 
                      className="quick-action-btn quick-action-danger"
                      onClick={() => {
                        closeUserDetails()
                        handleDelete(selectedUser.id)
                      }}
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}