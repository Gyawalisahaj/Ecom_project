# apps/core/catalog/management/commands/import_products.py
import csv
import json
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from catalog.models import Category, Brand, Product, ProductVariant
from media.models import ProductImage

class Command(BaseCommand):
    help = 'Bulk imports scraped tech products from a CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the scraped CSV file')

    def handle(self, *args, **options):
        file_path = options['csv_file']
        created_count = 0
        updated_count = 0

        try:
            with open(file_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)

                for row in reader:
                    with transaction.atomic():
                        # 1. Get or create Category and Brand
                        category, _ = Category.objects.get_or_create(
                            name=row['category'].strip()
                        )
                        brand, _ = Brand.objects.get_or_create(
                            name=row['brand'].strip()
                        )

                        # 2. Parse dynamic JSON specs safely
                        try:
                            specs = json.loads(row.get('specifications', '{}'))
                        except json.JSONDecodeError:
                            specs = {}

                        # 3. Create or update the Product (triggers Meilisearch signal!)
                        product, created = Product.objects.update_or_create(
                            name=row['name'].strip(),
                            brand=brand,
                            defaults={
                                'category': category,
                                'description': row.get('description', '').strip(),
                                'base_price': Decimal(row['base_price']),
                                'specifications': specs,
                                'is_active': True,
                            }
                        )

                        # 4. Create or update the default SKU Variant
                        ProductVariant.objects.update_or_create(
                            sku=row['sku'].strip(),
                            defaults={
                                'product': product,
                                'stock_quantity': int(row.get('stock_quantity', 10)),
                                'attributes': json.loads(row.get('variant_attributes', '{}'))
                            }
                        )

                        # 5. Attach scraped primary image URL if provided
                        image_url = row.get('image_url', '').strip()
                        if image_url:
                            ProductImage.objects.get_or_create(
                                product=product,
                                url=image_url,
                                defaults={
                                    'alt_text': product.name,
                                    'is_primary': True,
                                    'display_order': 0
                                }
                            )

                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(f'Import complete: {created_count} created, {updated_count} updated.')
            )

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Import failed: {str(e)}'))