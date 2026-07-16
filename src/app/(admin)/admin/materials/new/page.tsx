import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MaterialForm } from './material-form'


export default async function NewMaterialPage() {
  const supabase = createAdminClient()
  
  const { data: subjectsData } = await supabase
    .from('subjects')
    .select('id, name')
    .order('name')

  return <MaterialForm initialSubjects={(subjectsData as any[]) ?? []} />
}
