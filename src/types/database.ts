export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_admin_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          store_id: string;
        };
        Insert: {
          action: string;
          actor_admin_id?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          store_id: string;
        };
        Update: {
          action?: string;
          actor_admin_id?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_admin_id_fkey';
            columns: ['actor_admin_id'];
            isOneToOne: false;
            referencedRelation: 'store_admins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_log_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          store_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          store_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          phone: string;
          photo_url: string | null;
          store_id: string;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          phone: string;
          photo_url?: string | null;
          store_id: string;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          phone?: string;
          photo_url?: string | null;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          link: string | null;
          message: string;
          related_id: string | null;
          store_id: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          message: string;
          related_id?: string | null;
          store_id: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link?: string | null;
          message?: string;
          related_id?: string | null;
          store_id?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          quantity: number;
          unit_price_cents: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          quantity: number;
          unit_price_cents: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name_snapshot?: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          cancelled_by: string | null;
          cancelled_reason: string | null;
          created_at: string;
          customer_id: string;
          id: string;
          note: string | null;
          order_number: number;
          payment_confirmed_at: string | null;
          payment_method: Database['public']['Enums']['payment_method'];
          pickup_window_start: string;
          status: Database['public']['Enums']['order_status'];
          store_id: string;
          total_cents: number;
        };
        Insert: {
          cancelled_by?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          customer_id: string;
          id?: string;
          note?: string | null;
          order_number: number;
          payment_confirmed_at?: string | null;
          payment_method: Database['public']['Enums']['payment_method'];
          pickup_window_start: string;
          status?: Database['public']['Enums']['order_status'];
          store_id: string;
          total_cents: number;
        };
        Update: {
          cancelled_by?: string | null;
          cancelled_reason?: string | null;
          created_at?: string;
          customer_id?: string;
          id?: string;
          note?: string | null;
          order_number?: number;
          payment_confirmed_at?: string | null;
          payment_method?: Database['public']['Enums']['payment_method'];
          pickup_window_start?: string;
          status?: Database['public']['Enums']['order_status'];
          store_id?: string;
          total_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      password_reset_requests: {
        Row: {
          created_at: string;
          id: string;
          phone: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          phone: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          store_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          phone?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'password_reset_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      otp_codes: {
        Row: {
          attempts: number;
          code_hash: string;
          created_at: string;
          expires_at: string;
          id: string;
          max_attempts: number;
          phone: string;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          max_attempts?: number;
          phone: string;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          max_attempts?: number;
          phone?: string;
        };
        Relationships: [];
      };
      product_stock: {
        Row: {
          product_id: string;
          quantity_available: number;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          quantity_available?: number;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          quantity_available?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_stock_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          price_cents: number;
          sort_order: number;
          store_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          price_cents: number;
          sort_order?: number;
          store_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          price_cents?: number;
          sort_order?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_admins: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          phone: string;
          role: string;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          phone: string;
          role?: string;
          store_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string;
          role?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_admins_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          pickup_cutoff_minutes: number;
          pickup_location: string | null;
          slug: string;
          timezone: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          pickup_cutoff_minutes?: number;
          pickup_location?: string | null;
          slug: string;
          timezone?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          pickup_cutoff_minutes?: number;
          pickup_location?: string | null;
          slug?: string;
          timezone?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_order: {
        Args: { p_cancelled_by: string; p_order_id: string; p_reason: string };
        Returns: undefined;
      };
      create_order: {
        Args: {
          p_customer_id: string;
          p_items: Json;
          p_payment_method: Database['public']['Enums']['payment_method'];
          p_pickup_window_start: string;
          p_store_id: string;
        };
        Returns: {
          order_id: string;
          order_number: number;
        }[];
      };
    };
    Enums: {
      order_status: 'pending' | 'confirmed' | 'delivered' | 'no_show' | 'cancelled';
      payment_method: 'pix' | 'cash';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
