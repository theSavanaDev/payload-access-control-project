import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import {
	BoldFeature,
	ItalicFeature,
	LinkFeature,
	lexicalEditor,
	UnderlineFeature,
} from "@payloadcms/richtext-lexical";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { uploadthingStorage } from "@payloadcms/storage-uploadthing";
import { buildConfig } from "payload";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

import ContactRequest from "@/payload-collections/contact-request";
import Media from "@/payload-collections/media";
import Pages from "@/payload-collections/pages";
import Sites from "@/payload-collections/sites";
import Users from "@/payload-collections/users";

import { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const databaseURI =
	process.env.NODE_ENV === "development"
		? process.env.DATABASE_URI_DEV!
		: process.env.DATABASE_URI_PRD!;
const payloadSecret = process.env.PAYLOAD_SECRET!;
const resendAPIKey = process.env.RESEND_API_KEY!;
const uploadthingToken = process.env.UPLOADTHING_TOKEN!;
const publicURL =
	process.env.NODE_ENV === "development"
		? process.env.NEXT_PUBLIC_SERVER_URL_DEV!
		: process.env.NEXT_PUBLIC_SERVER_URL_PRD!;

// const generateTitle: GenerateTitle<Page | Post> = ({ doc }) => {
// 	return doc?.title ? `${doc.title} | Payload Starter` : "Payload Starter";
// };

// const generateURL: GenerateURL<Page | Post> = ({ doc }) => {
// 	return doc?.slug ? `${publicURL}/${doc.slug}` : publicURL;
// };

export default buildConfig({
	admin: {
		importMap: {
			baseDir: path.resolve(dirname),
		},
		livePreview: {
			breakpoints: [
				{
					label: "Mobile",
					name: "mobile",
					width: 375,
					height: 667,
				},
				{
					label: "Tablet",
					name: "tablet",
					width: 768,
					height: 1024,
				},
				{
					label: "Desktop",
					name: "desktop",
					width: 1440,
					height: 900,
				},
			],
		},
		user: Users.slug,
	},
	collections: [Sites, Pages, Media, ContactRequest, Users],
	db: mongooseAdapter({ url: databaseURI }),
	editor: lexicalEditor({
		features: () => {
			return [
				BoldFeature(),
				ItalicFeature(),
				LinkFeature({
					enabledCollections: ["pages"],
					fields: ({ defaultFields }) => {
						const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
							if ("name" in field && field.name === "url") return false;
							return true;
						});
						return [
							...defaultFieldsWithoutUrl,
							{
								name: "url",
								type: "text",
								admin: {
									condition: ({ linkType }) => linkType !== "internal",
								},
								label: ({ t }) => t("fields:enterURL"),
								required: true,
							},
						];
					},
				}),
				UnderlineFeature(),
			];
		},
	}),
	email: resendAdapter({
		defaultFromAddress: "mta@s3.co.ke",
		defaultFromName: "MTA @ S3",
		apiKey: resendAPIKey,
	}),
	globals: [],
	plugins: [
		seoPlugin({}),
		uploadthingStorage({
			collections: {
				[Media.slug]: true,
			},
			options: {
				token: uploadthingToken,
				acl: "public-read",
			},
		}),
	],
	secret: payloadSecret,
	sharp,
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
});
