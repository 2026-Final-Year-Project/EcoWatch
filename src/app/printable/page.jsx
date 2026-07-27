import PrintableReport from '@/components/PrintableReport'
import GeneratePdfButton from '@/components/GeneratePdfButton'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata = {
  title: 'Printable Report | EcoWatch',
  description: 'Printable incident report view',
}

export default function PrintablePage() {
  return (
    <>
      <div className="flex justify-end p-4 print:hidden">
        <ThemeToggle />
      </div>
      <PrintableReport />
      <div style={{ marginTop: 12 }}>
        <GeneratePdfButton />
      </div>
    </>
  )
}
