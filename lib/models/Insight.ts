
import mongoose, { Schema } from 'mongoose';

const InsightSchema = new Schema({
    source: {
        type: String,
        required: [true, 'Please provide a source name'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Please provide a source URL'],
        unique: true,
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
    },
    content: {
        type: String,
        required: [true, 'Please provide content summary or text'],
    },
    publishedDate: {
        type: Date,
        default: Date.now,
    },
    ingestedDate: {
        type: Date,
        default: Date.now,
    },
    isRelevant: {
        type: Boolean,
        default: false,
    },
    relevanceReasoning: {
        type: String,
        required: false,
    },
    tags: {
        type: [String],
        default: [],
    },
    category: {
        type: String, // 'Blog', 'Press', 'ISO', 'NGO'
        required: true,
    },
});

export default mongoose.models.Insight || mongoose.model('Insight', InsightSchema);
