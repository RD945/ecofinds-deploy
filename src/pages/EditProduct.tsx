import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

interface Category {
    id: number;
    name: string;
}

interface ProductImage {
    id: number;
    url: string | null;
}

const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
    price: z.coerce.number().positive({ message: "Price must be a positive number." }),
    category_id: z.coerce.number().int().positive(),
    images: z.instanceof(FileList).optional(),
    quantity: z.coerce.number().int().min(0, "Quantity can't be negative."),
    condition: z.string().min(3, "Condition is required."),
    brand: z.string().optional(),
    model: z.string().optional(),
    year_of_manufacture: z.coerce.number().int().optional(),
    material: z.string().optional(),
    color: z.string().optional(),
    dimension_l: z.coerce.number().optional(),
    dimension_w: z.coerce.number().optional(),
    dimension_h: z.coerce.number().optional(),
    is_original: z.boolean().default(false),
    has_manual: z.boolean().default(false),
    working_condition: z.string().optional(),
});

export const EditProduct = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            price: '' as any,
            category_id: undefined,
            quantity: 1,
            condition: "New",
            brand: "",
            model: "",
            material: "",
            color: "",
            working_condition: "",
            dimension_l: '' as any,
            dimension_w: '' as any,
            dimension_h: '' as any,
            is_original: false,
            has_manual: false,
        }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const categoriesResponse = await api.get('/categories');
                setCategories(categoriesResponse.data);

                const productResponse = await api.get(`/products/${id}`);
                const productData = productResponse.data;

                if (user && productData.seller_id !== user.id) {
                    navigate('/dashboard');
                    return;
                }

                // Separate existing images from the rest of the form data
                const { images, ...formData } = productData;

                form.reset({
                    ...formData,
                    price: parseFloat(formData.price),
                    dimension_l: formData.dimension_l ? parseFloat(formData.dimension_l) : undefined,
                    dimension_w: formData.dimension_w ? parseFloat(formData.dimension_w) : undefined,
                    dimension_h: formData.dimension_h ? parseFloat(formData.dimension_h) : undefined,
                });
                setExistingImages(images || []);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError("Could not load product data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user && id) {
            fetchInitialData();
        }
    }, [id, user, form, navigate]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key !== 'images' && value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        if (values.images) {
            Array.from(values.images).forEach(file => {
                formData.append('images', file);
            });
        }

        // Append existing images that are being kept
        existingImages.forEach(img => formData.append('existingImageIds', String(img.id)));

        try {
            await api.put(`/products/${id}`, formData);
            navigate("/dashboard");

        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred while updating the product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><p>Loading product...</p></div>;
    }

    if (error && !form.formState.isDirty) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-destructive">{error}</p></div>;
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b border-border p-4">
                <div className="container mx-auto">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Card className="w-full max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">Edit Product</CardTitle>
                        <CardDescription>Update the details of your product listing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="images"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Images (up to 5 total)</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed cursor-pointer bg-accent/50 hover:bg-accent/75">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop new images</p>
                                                        </div>
                                                        <Input
                                                            id="dropzone-file"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => {
                                                                const currentFiles = field.value ? Array.from(field.value) : [];
                                                                const newFiles = e.target.files ? Array.from(e.target.files) : [];
                                                                const combined = [...currentFiles, ...newFiles].slice(0, 5 - existingImages.length);

                                                                const dataTransfer = new DataTransfer();
                                                                combined.forEach(file => dataTransfer.items.add(file));

                                                                field.onChange(dataTransfer.files);
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                            {(existingImages.length > 0 || (field.value && field.value.length > 0)) && (
                                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                    {existingImages.map((image, index) => (
                                                        <div key={`existing-${image.id}`} className="relative aspect-square">
                                                            <img src={image.url || `http://localhost:5000/api/images/${image.id}`} alt={`Existing Preview ${index}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setExistingImages(prev => prev.filter(img => img.id !== image.id))}
                                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {field.value && Array.from(field.value).map((file, index) => (
                                                        <div key={`new-${index}`} className="relative aspect-square">
                                                            <img src={URL.createObjectURL(file)} alt={`New Preview ${index}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentFiles = Array.from(field.value);
                                                                    currentFiles.splice(index, 1);
                                                                    const dataTransfer = new DataTransfer();
                                                                    currentFiles.forEach(f => dataTransfer.items.add(f));
                                                                    field.onChange(dataTransfer.files);
                                                                }}
                                                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <FormDescription>First image will be the main display image.</FormDescription>
                                        </FormItem>
                                    )}
                                />

                                {/* Other form fields remain the same */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Bamboo Toothbrush Set" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe your product..." {...field} rows={5} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={String(field.value)}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={String(cat.id)} className="capitalize">{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="e.g., 499.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="condition"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Condition</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select condition" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="New">New</SelectItem>
                                                        <SelectItem value="Used - Like New">Used - Like New</SelectItem>
                                                        <SelectItem value="Used - Good">Used - Good</SelectItem>
                                                        <SelectItem value="Used - Fair">Used - Fair</SelectItem>
                                                        <SelectItem value="For Parts">For Parts or Not Working</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="e.g., 1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="working_condition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Working Condition</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe the working state..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Brand</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Apple" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="model"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Model</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., MacBook Pro 14" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="material"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Material</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Aluminum" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Space Gray" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormLabel>Dimensions (L x W x H in cm)</FormLabel>
                                    <div className="grid grid-cols-3 gap-4 mt-2">
                                        <FormField
                                            control={form.control}
                                            name="dimension_l"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Length" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dimension_w"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Width" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dimension_h"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" placeholder="Height" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="is_original"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Original Item</FormLabel>
                                                    <FormDescription> Check if this is an original product. </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="has_manual"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Manual Included</FormLabel>
                                                    <FormDescription> Check if the manual is included. </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                                <div className="flex justify-end gap-4">
                                    <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Product'}</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};
