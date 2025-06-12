import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class FileStorage {
  async uploadFile(file: File, options: UploadOptions): Promise<string> {
    try {
      const fileName = `${options.folder}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`File upload failed: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      console.error('File storage error:', error);
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer, options: BufferUploadOptions): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(options.filename, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: options.contentType
        });

      if (error) {
        throw new Error(`Buffer upload failed: ${error.message}`);
      }

      return data.path;
    } catch (error) {
      console.error('Buffer storage error:', error);
      throw error;
    }
  }

  async getFileUrl(bucket: string, path: string): Promise<string> {
    try {
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      return data?.signedUrl || '';
    } catch (error) {
      console.error('File URL generation error:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`File deletion failed: ${error.message}`);
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }
}

interface UploadOptions {
  bucket: string;
  folder: string;
}

interface BufferUploadOptions {
  bucket: string;
  filename: string;
  contentType: string;
}