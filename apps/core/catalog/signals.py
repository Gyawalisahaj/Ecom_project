# apps/core/catalog/signals.py
import meilisearch
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product

def get_meili_index():
    client = meilisearch.Client(settings.MEILI_HOST, settings.MEILI_MASTER_KEY)
    return client.index('products')

@receiver(post_save, sender=Product)
def sync_product_to_meilisearch(sender, instance, **kwargs):
    """
    Fires automatically every time a Product is created or updated.
    """
    try:
        index = get_meili_index()

        # If a seller marks a product inactive, remove it from public search
        if not instance.is_active:
            index.delete_document(str(instance.id))
            return

        # Flatten the relational data into a fast, searchable JSON document
        primary_image = instance.images.filter(is_primary=True).first()
        
        document = {
            "id": str(instance.id),
            "name": instance.name,
            "slug": instance.slug,
            "brand": instance.brand.name,
            "category": instance.category.name,
            "description": instance.description,
            "base_price": float(instance.base_price),
            "specifications": instance.specifications,
            "thumbnail": primary_image.url if primary_image else None,
        }

        index.add_documents([document])
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Meilisearch sync failed: %s", e)

@receiver(post_delete, sender=Product)
def remove_product_from_meilisearch(sender, instance, **kwargs):
    """
    Fires automatically when a Product is deleted from Django.
    """
    try:
        index = get_meili_index()
        index.delete_document(str(instance.id))
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Meilisearch deletion sync failed: %s", e)