import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSubjectCatalogApi } from "@/lib/server/subject-catalog-api";

const api = createSubjectCatalogApi({ authenticate: auth, db: prisma });
export const GET = api.GET;
export const POST = api.POST;
