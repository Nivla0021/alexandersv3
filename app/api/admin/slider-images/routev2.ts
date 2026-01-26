import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/db";
import { uploadFileToS3, deleteFile, getFileUrl } from '@/lib/s3';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    const products = await prisma.sliderImage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse FormData directly (don't use formidable for App Router)
    const formData = await req.formData();
    
    // Get form values
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;


    // --- Handle image file upload to S3 ---
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload to S3
        const cloud_storage_path = await uploadFileToS3(
          imageFile.name,
          buffer,
          imageFile.type || 'image/jpeg',
          true // isPublic
        );
        
        // Get public URL
        imageUrl = await getFileUrl(cloud_storage_path, true);
        
        console.log('✅ Image uploaded to S3:', imageUrl);
      } catch (error) {
        console.error('❌ Error uploading image to S3:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }
    }

    // Create product in database
    const product = await prisma.sliderImage.create({
        data: {
        name,
        image: imageUrl,
        },
    });

    console.log('Product created successfully:', product);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating Product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PATCH is similar: parse form, update fields, upload new image if present
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    // Check if product exists
    const existingProduct = await prisma.sliderImage.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let imageUrl = existingProduct.image;
    
    // Handle new image upload if provided
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Upload new image to S3
        const cloud_storage_path = await uploadFileToS3(
          imageFile.name,
          buffer,
          imageFile.type || 'image/jpeg',
          true // isPublic
        );
        
        // Get public URL
        imageUrl = await getFileUrl(cloud_storage_path, true);
        
        console.log('✅ Image uploaded to S3:', imageUrl);
        
        // Optional: Delete old image from S3 if it exists and is an S3 URL
        if (existingProduct.image && existingProduct.image.includes('amazonaws.com')) {
          try {
            // Extract cloud_storage_path from URL
            const urlParts = existingProduct.image.split('.amazonaws.com/');
            if (urlParts.length > 1) {
              const oldCloudPath = urlParts[1];
              await deleteFile(oldCloudPath);
              console.log('✅ Old image deleted from S3:', oldCloudPath);
            }
          } catch (error) {
            console.error('⚠️ Error deleting old image from S3:', error);
            // Don't fail the update if old image deletion fails
          }
        }
      } catch (error) {
        console.error('❌ Error uploading image to S3:', error);
        // Don't fail the update if image upload fails - keep existing image
      }
    }

    // Update product
    const updatedProduct = await prisma.sliderImage.update({
      where: { id },
      data: {
        name,
        image: imageUrl,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating Product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // First, fetch the product to get the image path
    const product = await prisma.sliderImage.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete the image file from S3 if it exists
    if (product.image && product.image.trim() !== '') {
      try {
        // Check if it's an S3 URL
        if (product.image.includes('amazonaws.com')) {
          // Extract cloud_storage_path from URL
          const urlParts = product.image.split('.amazonaws.com/');
          if (urlParts.length > 1) {
            const cloudPath = urlParts[1];
            await deleteFile(cloudPath);
            console.log(`✅ Image deleted from S3: ${cloudPath}`);
          }
        } else {
          // Legacy local file - log but don't fail
          console.warn(`⚠️ Skipping deletion of non-S3 image: ${product.image}`);
        }
      } catch (error) {
        console.error('❌ Error during S3 image deletion:', error);
        // Don't throw - continue with product deletion
      }
    }

    // Delete the product from database
    await prisma.sliderImage.delete({
      where: { id },
    });

    console.log(`✅ Product deleted: ${product.name} (${id})`);
    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedProduct: product.name 
    });
  } catch (error: any) {
    console.error('❌ Error deleting Product:', error);
    
    // Handle Prisma specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
