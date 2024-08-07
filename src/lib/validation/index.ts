import * as z from "zod"

export const SignupValidationSchema = z.object({
    name: z.string().min(2,{message:"Too Short"}),
    username: z.string().min(2,{message:"Too Short"}),
    email: z.string().email(),
    password: z.string().min(8,{message:"Password must be at least 8 characters"})
})

export const SigninValidationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8,{message:"Password must be at least 8 characters"})
})

export const PostValidation = z.object({
    caption: z.string().min(5).max(220),
    file: z.custom<File[]>(),
    location: z.string().min(2).max(100),
    tags: z.string()
})
