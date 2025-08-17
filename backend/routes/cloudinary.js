// routes/cloudinary.js
const express = require('express');
const { cloudinary } = require('../config/cloudinary');
const router = express.Router();

// Middleware to validate request body for delete operations
const validateDeleteRequest = (req, res, next) => {
  const { public_id } = req.body;
  
  if (!public_id) {
    return res.status(400).json({
      success: false,
      message: 'Public ID is required',
      error: 'MISSING_PUBLIC_ID'
    });
  }

  if (typeof public_id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Public ID must be a string',
      error: 'INVALID_PUBLIC_ID_TYPE'
    });
  }

  next();
};

// Helper function to handle errors
const handleError = (res, error, message = 'An error occurred') => {
  console.error(`Cloudinary Error: ${message}`, error);
  res.status(500).json({
    success: false,
    message,
    error: error.message || error,
    timestamp: new Date().toISOString()
  });
};

// GET /api/cloudinary/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connection is healthy',
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/cloudinary/images - Get images with pagination and search
router.get('/images', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      folder = 'business-images',
      sort_by = 'created_at',
      order = 'desc'
    } = req.query;

    console.log(`📋 Fetching images - Page: ${page}, Limit: ${limit}, Search: "${search}", Folder: "${folder}"`);

    // Build search expression
    let searchExpression = `folder:${folder}`;
    
    if (search && search.trim()) {
      // Search in filename or public_id
      searchExpression += ` AND (filename:*${search.trim()}* OR public_id:*${search.trim()}*)`;
    }

    console.log(`🔍 Search expression: ${searchExpression}`);

    // Execute search
    const result = await cloudinary.search
      .expression(searchExpression)
      .sort_by(sort_by, order)
      .max_results(parseInt(limit))
      .execute();

    console.log(`✅ Found ${result.resources?.length || 0} images (Total: ${result.total_count})`);

    // Transform the response to match expected format
    const transformedResources = result.resources?.map(resource => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      url: resource.url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      created_at: resource.created_at,
      folder: resource.folder,
      filename: resource.filename,
      resource_type: resource.resource_type,
      type: resource.type,
      version: resource.version,
      // Add any custom context or metadata
      context: resource.context,
      tags: resource.tags,
      metadata: resource.image_metadata
    })) || [];

    res.json({
      success: true,
      resources: transformedResources,
      total_count: result.total_count || 0,
      next_cursor: result.next_cursor,
      has_more: !!result.next_cursor,
      page: parseInt(page),
      limit: parseInt(limit),
      search_term: search,
      folder: folder
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch images');
  }
});

// GET /api/cloudinary/stats - Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    const { folder = 'business-images' } = req.query;

    console.log(`📊 Fetching storage stats for folder: ${folder}`);

    // Get basic usage stats (this may require a paid plan)
    let usageResult = null;
    try {
      usageResult = await cloudinary.api.usage();
    } catch (usageError) {
      console.log('⚠️  Usage data not available (may require paid plan)');
    }
    
    // Get folder-specific stats
    const folderStats = await cloudinary.search
      .expression(`folder:${folder}`)
      .aggregate('format')
      .max_results(1000) // Adjust based on your needs
      .execute();

    // Calculate detailed statistics
    const resources = folderStats.resources || [];
    const totalSize = resources.reduce((sum, img) => sum + (img.bytes || 0), 0);
    
    // Group by format
    const formatStats = resources.reduce((acc, img) => {
      const format = (img.format || 'unknown').toUpperCase();
      if (!acc[format]) {
        acc[format] = { count: 0, size: 0 };
      }
      acc[format].count++;
      acc[format].size += img.bytes || 0;
      return acc;
    }, {});

    // Get largest files
    const largestFiles = resources
      .sort((a, b) => (b.bytes || 0) - (a.bytes || 0))
      .slice(0, 10)
      .map(img => ({
        public_id: img.public_id,
        filename: img.filename,
        size: img.bytes,
        format: img.format,
        created_at: img.created_at,
        secure_url: img.secure_url
      }));

    // Get recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUploads = resources.filter(img => 
      new Date(img.created_at) > sevenDaysAgo
    ).length;

    const response = {
      success: true,
      stats: {
        // Folder-specific stats
        folder: {
          name: folder,
          total_images: folderStats.total_count || 0,
          total_size: totalSize,
          average_size: folderStats.total_count > 0 ? Math.round(totalSize / folderStats.total_count) : 0,
          recent_uploads: recentUploads,
          format_breakdown: formatStats,
          largest_files: largestFiles
        }
      },
      timestamp: new Date().toISOString()
    };

    // Add account stats if available
    if (usageResult) {
      response.stats.account = {
        plan: usageResult.plan,
        credits_used: usageResult.credits?.used || 0,
        credits_limit: usageResult.credits?.limit || 0,
        bandwidth_used: usageResult.bandwidth?.used || 0,
        bandwidth_limit: usageResult.bandwidth?.limit || 0,
        storage_used: usageResult.storage?.used || 0,
        storage_limit: usageResult.storage?.limit || 0
      };
    }

    res.json(response);

  } catch (error) {
    handleError(res, error, 'Failed to fetch storage statistics');
  }
});

// DELETE /api/cloudinary/delete - Delete single image
router.delete('/delete', validateDeleteRequest, async (req, res) => {
  try {
    const { public_id } = req.body;
    
    console.log(`🗑️  Attempting to delete image with public ID: ${public_id}`);
    
    const result = await cloudinary.uploader.destroy(public_id);
    
    console.log(`📋 Cloudinary delete result:`, result);
    
    const success = result.result === 'ok' || result.result === 'not found';
    
    res.json({
      success,
      message: result.result === 'ok' ? 'Image deleted successfully' : 
               result.result === 'not found' ? 'Image not found (may already be deleted)' : 
               'Failed to delete image',
      result: result.result,
      public_id
    });
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
      public_id: req.body.public_id
    });
  }
});

// POST /api/cloudinary/delete-multiple - Delete multiple images
router.post('/delete-multiple', async (req, res) => {
  try {
    const { public_ids } = req.body;
    
    if (!public_ids || !Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Public IDs array is required and must not be empty',
        error: 'INVALID_PUBLIC_IDS'
      });
    }

    console.log(`🗑️  Deleting multiple images:`, public_ids);
    
    // Delete images in batches (Cloudinary recommends max 100 at a time)
    const batchSize = 100;
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < public_ids.length; i += batchSize) {
      const batch = public_ids.slice(i, i + batchSize);
      
      try {
        const result = await cloudinary.api.delete_resources(batch);
        results.push(result);
        
        // Count successes and errors
        Object.values(result.deleted || {}).forEach(status => {
          if (status === 'deleted') {
            successCount++;
          } else {
            errorCount++;
          }
        });

        console.log(`Batch ${Math.floor(i/batchSize) + 1} result:`, {
          deleted: Object.keys(result.deleted || {}).length,
          not_found: Object.keys(result.not_found || {}).length
        });

      } catch (batchError) {
        console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, batchError);
        errorCount += batch.length;
        results.push({ error: batchError.message, batch });
      }
    }

    const response = {
      success: successCount > 0,
      message: `Deleted ${successCount} images successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      details: {
        total_requested: public_ids.length,
        successful: successCount,
        failed: errorCount,
        results: results
      }
    };

    res.json(response);

  } catch (error) {
    handleError(res, error, 'Failed to delete multiple images');
  }
});

// POST /api/cloudinary/upload - Upload image (optional - for testing)
router.post('/upload', async (req, res) => {
  try {
    const { image, folder = 'business-images', filename } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    const uploadOptions = {
      folder: folder,
      resource_type: 'auto'
    };

    if (filename) {
      uploadOptions.public_id = `${folder}/${filename}`;
    }

    const result = await cloudinary.uploader.upload(image, uploadOptions);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      result: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        created_at: result.created_at
      }
    });

  } catch (error) {
    handleError(res, error, 'Failed to upload image');
  }
});

// POST /api/cloudinary/cleanup-unused - Find potentially unused images
router.post('/cleanup-unused', async (req, res) => {
  try {
    const { 
      folder = 'business-images',
      dry_run = true,
      older_than_days = 30 
    } = req.body;

    console.log(`🧹 Starting cleanup analysis for folder: ${folder} (dry run: ${dry_run})`);

    // Get all images in the folder
    const allImages = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('created_at', 'asc')
      .max_results(1000)
      .execute();

    // Filter images older than specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - older_than_days);

    const oldImages = allImages.resources.filter(img => 
      new Date(img.created_at) < cutoffDate
    );

    // TODO: Implement logic to check which images are actually used in your application
    // This would typically involve checking your database for references to these images
    // Example:
    /*
    const usedImageIds = await checkImagesInDatabase(oldImages.map(img => img.public_id));
    const unusedImages = oldImages.filter(img => !usedImageIds.includes(img.public_id));
    */

    // For now, we'll just return analysis without actual deletion
    const analysis = {
      total_images: allImages.total_count,
      old_images: oldImages.length,
      cutoff_date: cutoffDate.toISOString(),
      sample_old_images: oldImages.slice(0, 10).map(img => ({
        public_id: img.public_id,
        created_at: img.created_at,
        size: img.bytes
      })),
      note: 'To complete this feature, implement database checking to identify truly unused images'
    };

    if (!dry_run) {
      // TODO: Implement actual deletion of unused images
      res.json({
        success: false,
        message: 'Actual deletion not implemented yet. Please implement database checking first.',
        analysis
      });
    } else {
      res.json({
        success: true,
        message: 'Cleanup analysis completed (dry run)',
        analysis,
        dry_run: true
      });
    }

  } catch (error) {
    handleError(res, error, 'Failed to perform cleanup analysis');
  }
});

// GET /api/cloudinary/folders - List all folders
router.get('/folders', async (req, res) => {
  try {
    console.log('📁 Fetching folder list...');

    const result = await cloudinary.api.root_folders();
    
    res.json({
      success: true,
      folders: result.folders || [],
      total_count: result.total_count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleError(res, error, 'Failed to fetch folders');
  }
});

// ADD THIS DEBUG ROUTE
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking all resources in Cloudinary...');
    
    // Get all resources without any filtering
    const allResources = await cloudinary.search
      .expression('resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();
    
    console.log(`📊 Total images found: ${allResources.total_count}`);
    console.log(`📋 Returned in this batch: ${allResources.resources?.length || 0}`);
    
    // Group by folder
    const folderGroups = {};
    allResources.resources?.forEach(resource => {
      const folder = resource.folder || 'root';
      if (!folderGroups[folder]) {
        folderGroups[folder] = [];
      }
      folderGroups[folder].push({
        public_id: resource.public_id,
        format: resource.format,
        created_at: resource.created_at,
        bytes: resource.bytes
      });
    });
    
    console.log('📁 Folders found:', Object.keys(folderGroups));
    
    res.json({
      success: true,
      debug: true,
      total_count: allResources.total_count,
      batch_size: allResources.resources?.length || 0,
      folders: folderGroups,
      raw_sample: allResources.resources?.slice(0, 5) || []
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;