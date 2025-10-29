'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface RelatedArticlesProps {
  articles: Array<{
    id: string
    title: string
    excerpt: string
  }>
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-2 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          相關法律文章
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3">
        {articles.slice(0, 2).map((article) => (
          <div
            key={article.id}
            className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
          >
            <h4 className="mb-1 text-sm font-medium line-clamp-2">{article.title}</h4>
            <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">{article.excerpt}</p>
            <Link href={`/dashboard/cases?highlight=${article.id}`}>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                查看詳情
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        ))}
        <Link href="/dashboard/cases">
          <Button variant="outline" size="sm" className="w-full text-xs">
            瀏覽更多案例
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
