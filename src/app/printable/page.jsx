import PrintableReport from '@/components/PrintableReport'
import GeneratePdfButton from '@/components/GeneratePdfButton'

export const metadata = {
  title: 'Printable Report | EcoWatch',
  description: 'Printable incident report view',
}

export default function PrintablePage() {
  return (
    <>
      <PrintableReport />
      <div style={{ marginTop: 12 }}>
        <GeneratePdfButton />
      </div>
    </>
  )
}
