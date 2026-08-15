"use client"

import { useEffect, useState } from "react"
import { Loader2, Package, Plus } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  getApiErrorMessage,
  uploadFile,
  useAddVariant,
  majorToMinor,
  minorToMajor,
  useCreateProduct,
  useMoney,
  useUpdateProduct,
  useUpdateVariant,
  type ApiProduct,
} from "@/api"

export type ProductFormMode =
  | { type: "create" }
  | { type: "edit-product"; product: ApiProduct }
  | { type: "add-variant"; product: ApiProduct }
  | {
      type: "edit-variant"
      product: ApiProduct
      variant: ApiProduct["variants"][number]
    }

export function ProductFormSheet({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ProductFormMode | null
}) {
  const money = useMoney()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const addVariant = useAddVariant()
  const updateVariant = useUpdateVariant()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sku, setSku] = useState("")
  const [variantLabel, setVariantLabel] = useState("Default")
  const [priceMajor, setPriceMajor] = useState("")
  const [stock, setStock] = useState("0")
  const [threshold, setThreshold] = useState("5")
  const [taxExempt, setTaxExempt] = useState(false)
  const [publishedToStore, setPublishedToStore] = useState(true)
  const [imageKey, setImageKey] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !mode) return
    setError(null)
    setUploading(false)
    if (mode.type === "create") {
      setName("")
      setDescription("")
      setSku("")
      setVariantLabel("Default")
      setPriceMajor("")
      setStock("0")
      setThreshold("5")
      setTaxExempt(false)
      setPublishedToStore(true)
      setImageKey(null)
      setImageUrl(null)
    } else if (mode.type === "edit-product") {
      setName(mode.product.name)
      setDescription(mode.product.description ?? "")
      setPublishedToStore(mode.product.publishedToStore ?? true)
      setImageKey(mode.product.imageKey ?? null)
      setImageUrl(mode.product.imageUrl ?? null)
    } else if (mode.type === "add-variant") {
      setSku("")
      setVariantLabel("")
      setPriceMajor("")
      setStock("0")
      setThreshold("5")
      setTaxExempt(false)
      setImageKey(null)
      setImageUrl(null)
    } else if (mode.type === "edit-variant") {
      const v = mode.variant
      setSku(v.sku ?? "")
      setVariantLabel(
        v.attributes
          ? Object.values(v.attributes).join(" / ") || "Default"
          : "Default",
      )
      const major = minorToMajor(v.priceCents, money.currency)
      setPriceMajor(
        Number.isInteger(major)
          ? String(major)
          : String(Number(major.toFixed(4))),
      )
      setThreshold(String(v.lowStockThreshold ?? 5))
      setTaxExempt(!!v.taxExempt)
      setImageKey(v.imageKey ?? null)
      setImageUrl(v.imageUrl ?? null)
    }
  }, [open, mode, money.currency])

  const busy =
    createProduct.isPending ||
    updateProduct.isPending ||
    addVariant.isPending ||
    updateVariant.isPending ||
    uploading

  async function onPickImage(file: File | null) {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be 8MB or smaller")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const purpose =
        mode?.type === "edit-variant" || mode?.type === "add-variant"
          ? "variant"
          : "product"
      const res = await uploadFile(file, purpose)
      setImageKey(res.key)
      setImageUrl(res.url)
    } catch (e) {
      setError(getApiErrorMessage(e) || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const title =
    mode?.type === "create"
      ? "Add product"
      : mode?.type === "edit-product"
        ? "Edit product"
        : mode?.type === "add-variant"
          ? "Add variant"
          : mode?.type === "edit-variant"
            ? "Edit variant"
            : "Catalog"

  async function submit() {
    if (!mode) return
    setError(null)
    try {
      if (mode.type === "create") {
        if (!name.trim()) {
          setError("Product name is required")
          return
        }
        const price = majorToMinor(Number(priceMajor) || 0, money.currency)
        if (price <= 0) {
          setError("Enter a unit price greater than 0")
          return
        }
        await createProduct.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          imageKey: imageKey || undefined,
          publishedToStore,
          variant: {
            sku: sku.trim() || undefined,
            priceCents: price,
            stockOnHand: Math.max(0, Math.floor(Number(stock) || 0)),
            lowStockThreshold: Math.max(0, Math.floor(Number(threshold) || 5)),
            taxExempt,
            attributes: variantLabel.trim()
              ? { label: variantLabel.trim() }
              : { label: "Default" },
          },
        })
      } else if (mode.type === "edit-product") {
        if (!name.trim()) {
          setError("Product name is required")
          return
        }
        await updateProduct.mutateAsync({
          id: mode.product.id,
          payload: {
            name: name.trim(),
            description: description.trim() || null,
            imageKey,
            publishedToStore,
          },
        })
      } else if (mode.type === "add-variant") {
        const price = majorToMinor(Number(priceMajor) || 0, money.currency)
        if (price <= 0) {
          setError("Enter a unit price greater than 0")
          return
        }
        await addVariant.mutateAsync({
          productId: mode.product.id,
          payload: {
            sku: sku.trim() || undefined,
            priceCents: price,
            stockOnHand: Math.max(0, Math.floor(Number(stock) || 0)),
            lowStockThreshold: Math.max(0, Math.floor(Number(threshold) || 5)),
            taxExempt,
            imageKey: imageKey || undefined,
            attributes: variantLabel.trim()
              ? { label: variantLabel.trim() }
              : { label: "Default" },
          },
        })
      } else if (mode.type === "edit-variant") {
        const price = majorToMinor(Number(priceMajor) || 0, money.currency)
        if (price <= 0) {
          setError("Enter a unit price greater than 0")
          return
        }
        await updateVariant.mutateAsync({
          variantId: mode.variant.id,
          payload: {
            sku: sku.trim() || null,
            priceCents: price,
            lowStockThreshold: Math.max(0, Math.floor(Number(threshold) || 5)),
            taxExempt,
            imageKey,
            attributes: variantLabel.trim()
              ? { label: variantLabel.trim() }
              : { label: "Default" },
          },
        })
      }
      onOpenChange(false)
    } catch (e) {
      setError(getApiErrorMessage(e) || "Could not save")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            {mode?.type === "create" ? (
              <Plus className="size-4 text-primary" />
            ) : (
              <Package className="size-4 text-primary" />
            )}
            {title}
          </SheetTitle>
          <SheetDescription>
            {mode?.type === "create"
              ? "Optional catalog — creates a product with one sellable variant."
              : mode?.type === "edit-product"
                ? "Update product name and description."
                : mode?.type === "add-variant"
                  ? `Add a size/color/SKU under ${mode.product.name}.`
                  : "Update price, SKU, and stock alerts. Use Restock for quantity."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {mode?.type === "create" || mode?.type === "edit-product" ? (
            <>
              <Field
                label="Product name"
                value={name}
                onChange={setName}
                placeholder="e.g. Ankara dress"
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Description (optional)
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Shown on your Workspace store"
                  className="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <ImageField
                url={imageUrl}
                uploading={uploading}
                onPick={(f) => void onPickImage(f)}
                onClear={() => {
                  setImageKey(null)
                  setImageUrl(null)
                }}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={publishedToStore}
                  onChange={(e) => setPublishedToStore(e.target.checked)}
                  className="size-3.5 rounded border-border"
                />
                Publish to Workspace store
              </label>
            </>
          ) : null}

          {mode?.type === "create" ||
          mode?.type === "add-variant" ||
          mode?.type === "edit-variant" ? (
            <>
              <Field
                label="Variant label"
                value={variantLabel}
                onChange={setVariantLabel}
                placeholder="e.g. Size M / Red"
              />
              {(mode.type === "add-variant" ||
                mode.type === "edit-variant") && (
                <ImageField
                  url={imageUrl}
                  uploading={uploading}
                  onPick={(f) => void onPickImage(f)}
                  onClear={() => {
                    setImageKey(null)
                    setImageUrl(null)
                  }}
                  label="Variant image (optional)"
                />
              )}
              <Field
                label="SKU (optional)"
                value={sku}
                onChange={setSku}
                placeholder="SKU-001"
              />
              <Field
                label={money.label("Unit price")}
                value={priceMajor}
                onChange={setPriceMajor}
                placeholder="15000"
                type="number"
              />
              {mode.type !== "edit-variant" ? (
                <Field
                  label="Opening stock"
                  value={stock}
                  onChange={setStock}
                  placeholder="0"
                  type="number"
                />
              ) : null}
              <Field
                label="Low-stock threshold"
                value={threshold}
                onChange={setThreshold}
                placeholder="5"
                type="number"
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={taxExempt}
                  onChange={(e) => setTaxExempt(e.target.checked)}
                  className="size-3.5 rounded border-border"
                />
                Tax-free (exclude from VAT)
              </label>
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="border-t border-border sm:flex-row">
          <Button
            variant="outline"
            className="bg-card"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={busy}
            className="gap-2"
            onClick={() => void submit()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  )
}

function ImageField({
  url,
  uploading,
  onPick,
  onClear,
  label = "Product image",
}: {
  url: string | null
  uploading: boolean
  onPick: (file: File | null) => void
  onClear: () => void
  label?: string
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {url ? (
        <div className="flex items-center gap-3">
          <img
            src={url}
            alt=""
            className="size-16 rounded-md border border-border object-cover"
          />
          <Button type="button" size="sm" variant="outline" onClick={onClear}>
            Remove
          </Button>
        </div>
      ) : null}
      <label className="flex cursor-pointer flex-col gap-1 rounded-md border border-dashed border-input px-3 py-3 text-sm text-muted-foreground">
        {uploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Uploading to storage…
          </span>
        ) : (
          <span>JPEG, PNG, WebP · max 8MB · Cloudflare R2 when configured</span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
