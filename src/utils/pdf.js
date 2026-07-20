import html2canvas from "html2canvas"

import jsPDF from "jspdf"

export async function generatePDF(){

    const report=document.getElementById("report")

    const canvas=await html2canvas(report)

    const image=canvas.toDataURL("image/png")

    const pdf=new jsPDF()

    pdf.addImage(image,"PNG",0,0,210,297)

    pdf.save("IncidentReport.pdf")

}