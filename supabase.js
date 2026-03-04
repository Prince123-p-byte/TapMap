import { createClient } from '@supabase/supabase-js'

// ==================== INITIALIZATION ====================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ==================== AUTH API ====================
export const authAPI = {
    // Register new user
    register: async (email, password) => {
        try {
            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            })
            
            if (authError) throw authError
            
            if (authData.user) {
                // Create business record
                const { error: businessError } = await supabase
                    .from('businesses')
                    .insert([{
                        auth_user_id: authData.user.id,
                        name: email.split('@')[0] || 'My Business',
                        email: email,
                        location_lat: 40.7128,
                        location_lng: -74.0060
                    }])
                
                if (businessError) throw businessError
                
                // Create analytics record
                const { error: analyticsError } = await supabase
                    .from('analytics')
                    .insert([{
                        business_id: authData.user.id,
                        views: 0,
                        scans: 0,
                        maps: 0,
                        contacts: 0
                    }])
                
                if (analyticsError) throw analyticsError
            }
            
            return authData.user
        } catch (err) {
            console.error('Registration error:', err)
            if (err.message.includes('User already registered')) {
                throw new Error('Email already registered')
            }
            throw new Error('Registration failed: ' + err.message)
        }
    },

    // Login
    login: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) throw error
            return data.user
        } catch (err) {
            console.error('Login error:', err)
            if (err.message.includes('Invalid login credentials')) {
                throw new Error('Invalid email or password')
            }
            throw new Error('Login failed: ' + err.message)
        }
    },

    // Logout
    logout: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Get current user
    getCurrentUser: async () => {
        const { data } = await supabase.auth.getUser()
        return data?.user
    },

    // Listen to auth changes
    onAuthChange: (callback) => {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(session?.user || null)
        })
    },

    // Delete account
    deleteAccount: async (userId) => {
        try {
            // Note: Deleting user requires admin API or trigger
            // For now, just sign out
            await supabase.auth.signOut()
        } catch (err) {
            console.error('Delete account error:', err)
            throw new Error('Failed to delete account')
        }
    }
}

// ==================== BUSINESS API ====================
export const businessAPI = {
    // Get business by user ID
    getByUserId: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('auth_user_id', userId)
                .single()
            
            if (error && error.code !== 'PGRST116') throw error
            return data
        } catch (err) {
            console.error('Error getting business:', err)
            return null
        }
    },

    // Get business by ID
    getById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single()
            
            if (error) throw error
            return data
        } catch (err) {
            console.error('Error getting business:', err)
            return null
        }
    },

    // Save/Update business
    save: async (userId, businessData) => {
        try {
            // Format data for Supabase
            const formattedData = {
                name: businessData.name,
                tagline: businessData.tagline,
                description: businessData.desc,
                address: businessData.address,
                phone: businessData.phone,
                email: businessData.email,
                location_lat: businessData.location?.lat || 40.7128,
                location_lng: businessData.location?.lng || -74.0060,
                profile_image: businessData.profileImage,
                cover_image: businessData.coverImage,
                portfolio: businessData.portfolio || []
            }

            const { data, error } = await supabase
                .from('businesses')
                .update(formattedData)
                .eq('auth_user_id', userId)
                .select()
                .single()
            
            if (error) throw error
            return data
        } catch (err) {
            console.error('Error saving business:', err)
            throw new Error('Failed to save business')
        }
    },

    // Get all businesses
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
            
            if (error) throw error
            return data || []
        } catch (err) {
            console.error('Error getting businesses:', err)
            return []
        }
    },

    // Real-time listener for all businesses
    listenAll: (callback) => {
        return supabase
            .channel('businesses-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'businesses' },
                async (payload) => {
                    // Get fresh data
                    const { data } = await supabase
                        .from('businesses')
                        .select('*')
                    callback(data || [])
                }
            )
            .subscribe()
    },

    // Real-time listener for single business
    listen: (businessId, callback) => {
        return supabase
            .channel('business-change-' + businessId)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'businesses',
                    filter: `id=eq.${businessId}`
                },
                (payload) => {
                    callback(payload.new)
                }
            )
            .subscribe()
    }
}

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
    // Log activity (increment counter)
    logActivity: async (businessId, type) => {
        if (!businessId) return
        
        try {
            await supabase.rpc('increment_analytics', {
                p_business_id: businessId,
                p_field: type
            })
        } catch (err) {
            console.error('Error logging activity:', err)
        }
    },

    // Get analytics by business ID
    getByBusinessId: async (businessId) => {
        try {
            const { data, error } = await supabase
                .from('analytics')
                .select('*')
                .eq('business_id', businessId)
                .single()
            
            if (error && error.code !== 'PGRST116') throw error
            return data || { views: 0, scans: 0, maps: 0, contacts: 0 }
        } catch (err) {
            console.error('Error getting analytics:', err)
            return { views: 0, scans: 0, maps: 0, contacts: 0 }
        }
    },

    // Real-time listener for analytics
    listen: (businessId, callback) => {
        return supabase
            .channel('analytics-' + businessId)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'analytics',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    callback(payload.new || { views: 0, scans: 0, maps: 0, contacts: 0 })
                }
            )
            .subscribe()
    }
}

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
    // Create notification
    create: async (businessId, data) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    business_id: businessId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    icon: data.icon || 'bell'
                }])
            
            if (error) throw error
        } catch (err) {
            console.error('Error creating notification:', err)
        }
    },

    // Get notifications for business
    getByBusinessId: async (businessId) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
        } catch (err) {
            console.error('Error getting notifications:', err)
            return []
        }
    },

    // Real-time listener for notifications
    listen: (businessId, callback) => {
        return supabase
            .channel('notifications-' + businessId)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'notifications',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        callback([payload.new])
                    }
                }
            )
            .subscribe()
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
            
            if (error) throw error
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    },

    // Mark all as read
    markAllAsRead: async (businessId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('business_id', businessId)
                .eq('read', false)
            
            if (error) throw error
        } catch (err) {
            console.error('Error marking all as read:', err)
        }
    }
}

// ==================== STORAGE API ====================
export const storageAPI = {
    // Upload image
    uploadImage: async (bucket, path, file) => {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    upsert: true
                })
            
            if (error) throw error
            
            // Get public URL
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(path)
            
            return data.publicUrl
        } catch (err) {
            console.error('Error uploading image:', err)
            throw err
        }
    },

    // Delete image
    deleteImage: async (bucket, path) => {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path])
            
            if (error) throw error
        } catch (err) {
            console.error('Error deleting image:', err)
        }
    },

    // Generate path for business image
    getImagePath: (userId, fileName) => {
        return `${userId}/${fileName}`
    }
}

// ==================== HELPER FUNCTIONS ====================
export const formatBusinessData = (supabaseData) => {
    if (!supabaseData) return null
    
    return {
        id: supabaseData.id,
        name: supabaseData.name,
        tagline: supabaseData.tagline,
        desc: supabaseData.description,
        address: supabaseData.address,
        phone: supabaseData.phone,
        email: supabaseData.email,
        location: {
            lat: supabaseData.location_lat,
            lng: supabaseData.location_lng
        },
        profileImage: supabaseData.profile_image,
        coverImage: supabaseData.cover_image,
        portfolio: supabaseData.portfolio || []
    }
}

// ==================== EXPORT ALL ====================
export default {
    auth: authAPI,
    businesses: businessAPI,
    analytics: analyticsAPI,
    notifications: notificationsAPI,
    storage: storageAPI,
    formatBusinessData
}