#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n🖼️ Loading Images and Certificates Data\n'));

async function loadImages() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get jewelry items to create images for
    const jewelryItems = await db.query('SELECT id, sku, name, selling_price FROM jewelry_items');
    
    if (jewelryItems.rows.length === 0) {
      console.log('⚠️ No jewelry items found. Please run inventory loading script first.');
      return { success: true, imagesLoaded: 0, certificatesLoaded: 0 };
    }

    console.log(`📸 Creating images for ${jewelryItems.rows.length} jewelry items...`);

    const images = [];
    const certificates = [];

    jewelryItems.rows.forEach(item => {
      // Create 1-4 images per item
      const imageCount = 1 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < imageCount; i++) {
        const filename = `${item.sku.toLowerCase()}_${i + 1}.jpg`;
        const image = {
          id: uuidv4(),
          jewelry_item_id: item.id,
          filename: filename,
          original_filename: `original_${filename}`,
          file_path: `/uploads/jewelry/${filename}`,
          cdn_url: `https://cdn.jewelryshop.com/jewelry/${filename}`,
          file_size: 150000 + Math.floor(Math.random() * 300000), // 150KB to 450KB
          mime_type: 'image/jpeg',
          width: 800 + Math.floor(Math.random() * 400), // 800-1200px
          height: 600 + Math.floor(Math.random() * 400), // 600-1000px
          is_primary: i === 0, // First image is primary
          alt_text: `${item.name} - View ${i + 1}`,
          tags: [item.name.toLowerCase(), 'jewelry', 'handcrafted', 'premium'],
          upload_source: 'admin',
          created_at: new Date(),
        };
        images.push(image);
      }

      // Create certificates for premium items
      if (item.selling_price > 50000) {
        const certificateTypes = ['hallmark', 'quality', 'appraisal'];
        const certType = certificateTypes[Math.floor(Math.random() * certificateTypes.length)];
        
        const certificate = {
          id: uuidv4(),
          jewelry_item_id: item.id,
          certificate_type: certType,
          certificate_number: `${certType.toUpperCase()}${Date.now()}${Math.floor(Math.random() * 1000)}`,
          issuing_authority: certType === 'hallmark' ? 'Bureau of Indian Standards' : 
                           certType === 'quality' ? 'Gem & Jewellery Export Promotion Council' :
                           'Certified Gemologist Institute',
          issue_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          validity_date: new Date(Date.now() + (5 + Math.random() * 5) * 365 * 24 * 60 * 60 * 1000), // 5-10 years
          grade: ['A+', 'A', 'A-'][Math.floor(Math.random() * 3)],
          purity_tested: item.selling_price > 100000 ? 91.6 + Math.random() * 0.2 : null,
          weight_certified: 5 + Math.random() * 50,
          document_url: `https://certificates.jewelryshop.com/${item.sku.toLowerCase()}_cert.pdf`,
          qr_code: `https://verify.jewelryshop.com/qr/${item.sku.toLowerCase()}`,
          verification_url: `https://verify.jewelryshop.com/${item.sku.toLowerCase()}`,
          is_active: true,
          created_at: new Date(),
        };
        certificates.push(certificate);
      }
    });

    // Insert images
    console.log('\n📥 Inserting images...');
    const imageResult = await db.bulkInsert('images', images, ['filename'], ['cdn_url', 'file_size']);
    
    // Insert certificates
    console.log('\n📥 Inserting certificates...');
    const certificateResult = await db.bulkInsert('certificates', certificates, ['certificate_number'], ['validity_date']);

    console.log('\n✅ Verifying data...');
    const finalCounts = {
      images: await db.getRowCount('images'),
      certificates: await db.getRowCount('certificates'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    console.log(chalk.green.bold('\n✅ Images data loading completed successfully!\n'));

    return {
      success: true,
      imagesLoaded: finalCounts.images,
      certificatesLoaded: finalCounts.certificates,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading images data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadImages()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadImages;