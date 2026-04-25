import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/common/Button';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { productApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { ProductCategory, ProductMutationPayload, ProductUnit } from '../types';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  price: z.coerce.number().positive('Prix invalide'),
  quantity: z.coerce.number().nonnegative('Quantite invalide'),
  category: z.enum(['fresh', 'frozen', 'dry']),
  isBio: z.boolean(),
  unit: z.enum(['kg', 'unit']),
  minimumStock: z.coerce.number().nonnegative('Seuil invalide'),
  description: z.string().trim().max(500, 'Description trop longue').optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const fieldClassName = 'h-12 w-full rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-white/28';
const labelClassName = 'space-y-2';
const errorClassName = 'text-xs uppercase tracking-[0.16em] text-[#ff9077]';

export default function NewProductPage() {
  const navigate = useNavigate();
  const setProducts = useAppStore((state) => state.setProducts);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      price: 0,
      quantity: 0,
      category: 'fresh',
      isBio: false,
      unit: 'kg',
      minimumStock: 0,
      description: '',
    },
    mode: 'onChange',
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitError(null);

    try {
      const payload: ProductMutationPayload = {
        name: values.name.trim(),
        price: values.price,
        quantity: values.quantity,
        category: values.category as ProductCategory,
        isBio: values.isBio,
        unit: values.unit as ProductUnit,
        minimumStock: values.minimumStock,
        description: values.description?.trim() ? values.description.trim() : null,
      };

      const product = await productApi.create(payload);
      const currentProducts = useAppStore.getState().products;
      setProducts([product, ...currentProducts.filter((item) => item.id !== product.id)]);
      navigate('/products', { replace: true });
    } catch (error) {
      console.error(error);
      setSubmitError('La creation du produit a echoue.');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          action={
            <Button onClick={() => navigate('/products')} variant="ghost">
              <ArrowLeft size={16} />
              Retour inventaire
            </Button>
          }
          description="Page dediee uniquement a l ajout de nouveaux produits."
          eyebrow="Nouveau produit"
          title="Ajouter un produit"
        />

        <form
          className="space-y-6 rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.22)]"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName}>
                <span className="premium-label">Nom produit</span>
                <input className={fieldClassName} placeholder="Tomates roma" {...register('name')} />
                {errors.name ? <p className={errorClassName}>{errors.name.message}</p> : null}
              </label>

              <label className={labelClassName}>
                <span className="premium-label">Prix</span>
                <input className={fieldClassName} min="0" step="0.01" type="number" {...register('price')} />
                {errors.price ? <p className={errorClassName}>{errors.price.message}</p> : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className={labelClassName}>
                <span className="premium-label">Quantite initiale</span>
                <input className={fieldClassName} min="0" step="0.01" type="number" {...register('quantity')} />
                {errors.quantity ? <p className={errorClassName}>{errors.quantity.message}</p> : null}
              </label>

              <label className={labelClassName}>
                <span className="premium-label">Categorie</span>
                <select className={fieldClassName} {...register('category')}>
                  <option value="fresh">Frais</option>
                  <option value="frozen">Surgeles</option>
                  <option value="dry">Sec</option>
                </select>
              </label>

              <div className={labelClassName}>
                <span className="premium-label">Type</span>
                <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 text-sm text-white">
                  <input className="h-4 w-4" type="checkbox" {...register('isBio')} />
                  Produit bio
                </label>
              </div>

              <label className={labelClassName}>
                <span className="premium-label">Unite</span>
                <select className={fieldClassName} {...register('unit')}>
                  <option value="kg">kg</option>
                  <option value="unit">unite</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <label className={labelClassName}>
                <span className="premium-label">Seuil minimum</span>
                <input className={fieldClassName} min="0" step="0.01" type="number" {...register('minimumStock')} />
                {errors.minimumStock ? <p className={errorClassName}>{errors.minimumStock.message}</p> : null}
              </label>

              <label className={labelClassName}>
                <span className="premium-label">Description</span>
                <textarea className="min-h-[120px] w-full rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/28" placeholder="Optionnel" {...register('description')} />
                {errors.description ? <p className={errorClassName}>{errors.description.message}</p> : null}
              </label>
            </div>

            {submitError ? <p className={errorClassName}>{submitError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={!isValid || isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : null}
              Creer produit
            </Button>
            <Button onClick={() => navigate('/products')} type="button" variant="ghost">
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}