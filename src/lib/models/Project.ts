import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js';
}

export interface IProject extends Document {
  slug: string;
  title: string;
  htmlBundle: string;
  files: IProjectFile[];
  ownerType: 'guest' | 'user';
  ownerId: string;
  editToken: string;
  createdAt: Date;
  expiresAt: Date;
  views: number;
}

const ProjectFileSchema = new Schema<IProjectFile>({
  name: { type: String, required: true },
  content: { type: String, default: '' },
  type: { type: String, enum: ['html', 'css', 'js'], required: true },
});

const ProjectSchema = new Schema<IProject>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Untitled Project',
    },
    htmlBundle: {
      type: String,
      required: true,
    },
    files: {
      type: [ProjectFileSchema],
      default: [],
    },
    ownerType: {
      type: String,
      enum: ['guest', 'user'],
      default: 'guest',
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    editToken: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

// TTL Index for auto-deletion when expiresAt is reached!
ProjectSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
