import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


interface Category {
    id: number;
    name: string;
}

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category_id: z.coerce.number().int().positive("Category is required"),
  images: z.instanceof(FileList).refine(files => files?.length > 0, "At least one image is required."),
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

export const AddProduct = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (err) {
            console.error("Failed to fetch categories", err);
            // Optionally set an error state to show in the UI
        }
    };
    fetchCategories();
  }, []);

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
      is_original: false,
      has_manual: false,
      working_condition: "",
      dimension_l: '' as any,
      dimension_w: '' as any,
      dimension_h: '' as any,
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 5)); // Limit to 5 images
    }
  };
  
  const removeImage = (index: number) => {
    // This is a bit tricky with FileList, easier to just clear and re-select
    form.setValue('images', new DataTransfer().files);
    setImagePreviews([]);
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null);
    setIsSubmitting(true);
    
    const formData = new FormData();

    // Append all form fields to FormData
    Object.entries(values).forEach(([key, value]) => {
        if (key !== 'images' && value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    // Append images
    if (values.images) {
        Array.from(values.images).forEach(file => {
            formData.append('images', file);
        });
    }

    try {
      await api.post('/products', formData);
      navigate("/dashboard");

    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">List a New Item</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto card-eco">
          <CardHeader>
            <CardTitle>Add a New Product</CardTitle>
            <CardDescription>
              Fill out the details below to list your eco-friendly item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Images (up to 5)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-accent/50 hover:bg-accent/75">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (MAX. 5 images)</p>
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
                                        const combined = [...currentFiles, ...newFiles].slice(0, 5);
                                        
                                        const dataTransfer = new DataTransfer();
                                        combined.forEach(file => dataTransfer.items.add(file));
                                        
                                        field.onChange(dataTransfer.files);
                                    }}
                                />
                            </label>
                        </div> 
                      </FormControl>
                      <FormMessage />
                       {field.value && field.value.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {Array.from(field.value).map((file, index) => (
                                  <div key={index} className="relative aspect-square">
                                      <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
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

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bamboo Toothbrush Set"
                          {...field}
                          className="input-eco"
                        />
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
                        <Textarea
                          placeholder="Describe your product's features and eco-friendly benefits."
                          {...field}
                          className="input-eco"
                          rows={5}
                        />
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
                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                            <SelectTrigger className="input-eco w-full">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 499.00"
                          {...field}
                          className="input-eco"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="btn-eco-outline"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-eco" disabled={isSubmitting}>
                    {isSubmitting ? "Listing Product..." : "List Product"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the item's condition" />
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
                        <FormLabel>Working Condition Description</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Describe the current working state, any flaws, etc." {...field} />
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
                        <Input placeholder="e.g., Aluminum, Cotton" {...field} />
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Original Item</FormLabel>
                                <FormDescription>
                                    Check this if the item is an original product, not a copy.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="has_manual"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Manual Included</FormLabel>
                                <FormDescription>
                                    Check this if the original manual/instructions are included.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
              </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};