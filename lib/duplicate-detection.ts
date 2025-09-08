import { createServiceRoleClient } from '@/lib/supabase/server'

export async function checkForDuplicates(
  workspaceId: string,
  fingerprints: string[],
  threshold: number = 0.85
) {
  const supabase = createServiceRoleClient()
  
  const { data: existingPages } = await supabase
    .from('pages')
    .select('id, fingerprint64, document_id, page_number')
    .in('fingerprint64', fingerprints)
    .eq('documents.workspace_id', workspaceId)

  if (!existingPages || existingPages.length === 0) {
    return { duplicates: [], similar: [] }
  }

  const duplicates = []
  const similar = []
  
  for (const fp of fingerprints) {
    const matches = existingPages.filter(p => p.fingerprint64 === fp)
    if (matches.length > 0) {
      duplicates.push({
        fingerprint: fp,
        matches: matches.map(m => ({
          documentId: m.document_id,
          pageNumber: m.page_number
        }))
      })
    }
  }

  return { duplicates, similar }
}

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

export async function findSimilarDocuments(
  workspaceId: string,
  text: string,
  minSimilarity: number = 0.7
) {
  const supabase = createServiceRoleClient()
  
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      pages (
        text,
        page_number
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'indexed')

  if (!documents) return []

  const similarities = []
  
  for (const doc of documents) {
    let maxSimilarity = 0
    let mostSimilarPage = 0
    
    for (const page of doc.pages || []) {
      if (!page.text) continue
      const similarity = calculateSimilarity(text, page.text)
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
        mostSimilarPage = page.page_number
      }
    }
    
    if (maxSimilarity >= minSimilarity) {
      similarities.push({
        documentId: doc.id,
        title: doc.title,
        similarity: maxSimilarity,
        page: mostSimilarPage
      })
    }
  }
  
  return similarities.sort((a, b) => b.similarity - a.similarity)
}
