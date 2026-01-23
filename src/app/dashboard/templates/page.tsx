import Link from "next/link";

const templates = [
  {
    id: "chatbot",
    name: "Customer Support Chatbot",
    description: "A conversational AI bot for customer queries",
    icon: "💬",
    nodes: 5,
  },
  {
    id: "content-gen",
    name: "Content Generator",
    description: "Generate blog posts, social media content",
    icon: "✍️",
    nodes: 4,
  },
  {
    id: "data-processor",
    name: "Data Processor",
    description: "Process and transform data with AI",
    icon: "🔄",
    nodes: 6,
  },
  {
    id: "image-pipeline",
    name: "Image Generation Pipeline",
    description: "Generate and edit images with AI",
    icon: "🎨",
    nodes: 4,
  },
  {
    id: "translator",
    name: "Multi-language Translator",
    description: "Translate content to multiple languages",
    icon: "🌐",
    nodes: 3,
  },
  {
    id: "summarizer",
    name: "Document Summarizer",
    description: "Summarize long documents automatically",
    icon: "📄",
    nodes: 3,
  },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Templates</h1>
        <p className="text-gray-400 mt-1">
          Start with a pre-built template and customize it to your needs
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/dashboard/workflow/new?template=${template.id}`}
            className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-800 group-hover:bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl transition-colors">
                {template.icon}
              </div>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                {template.nodes} nodes
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
              {template.name}
            </h3>
            <p className="text-gray-400 text-sm mt-2">{template.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
