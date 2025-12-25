import { z } from 'zod'

export const bookSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  directImageUrl: z.string().optional().nullable(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.number().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  directFileUrl: z.string().optional().nullable(),
  summary: z.string().optional(),
  extractedContent: z.string().optional().nullable(),
  buyingPrice: z.number().nullable(),
  sellingPrice: z.number().nullable(),
  numberOfCopies: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  isPublic: z.boolean().optional(),
  requiresPremium: z.boolean().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authors: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  publications: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
})

export const createBookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  isPublic: z.boolean().optional(),
  requiresPremium: z.boolean().default(false),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books',
        path: ['fileUrl'],
      });
    }
  }
});

export const updateBookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional(),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  isPublic: z.boolean().optional(),
  requiresPremium: z.boolean().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books',
        path: ['fileUrl'],
      });
    }
  }
});

// Types
export type Book = z.infer<typeof bookSchema>
export type CreateBookData = z.infer<typeof createBookSchema>
export type UpdateBookData = z.infer<typeof updateBookSchema>

// Book type options
export const bookTypes = [
  { value: 'HARD_COPY', label: 'Hard Copy' },
  { value: 'EBOOK', label: 'eBook' },
  { value: 'AUDIO', label: 'Audio Book' },
] as const

// Column configuration for data table
export const bookColumns = [
  {
    key: 'name',
    label: 'Book Name',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
  },
  {
    key: 'authors',
    label: 'Authors',
    sortable: false,
  },
  {
    key: 'publications',
    label: 'Publications',
    sortable: false,
  },
  {
    key: 'categories',
    label: 'Categories',
    sortable: false,
  },
  {
    key: 'numberOfCopies',
    label: 'Copies',
    sortable: true,
  },
  {
    key: 'entryDate',
    label: 'Entry Date',
    sortable: true,
  },
  {
    key: 'entryBy',
    label: 'Entry By',
    sortable: true,
  },
]