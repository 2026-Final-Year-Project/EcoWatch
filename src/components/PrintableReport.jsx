"use client"

import "@/styles/printable.css"

import { useState, useEffect } from "react"
import { fetchJson } from "@/lib/api"

export default function PrintableReport() {
    const [incident, setIncident] = useState(null)
    const [authorities, setAuthorities] = useState([])
    const [apiError, setApiError] = useState(null)

    useEffect(() => {
        let cancelled = false

        const loadPrintableData = async () => {
            try {
                const [report, authorityItems] = await Promise.all([
                    fetchJson("/reports/latest"),
                    fetchJson("/authorities"),
                ])

                if (cancelled) return

                setIncident(report)
                setAuthorities(authorityItems.map((item) => item.name))
                setApiError(null)
            } catch (error) {
                if (cancelled) return
                setApiError(error.message)
            }
        }

        const updateTime = () => {
            const now = new Date()

            setIncident((prev) => prev ? ({
                ...prev,
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
            }) : prev)
        }

        loadPrintableData()

        const timer = setInterval(updateTime, 1000)

        return () => {
            cancelled = true
            clearInterval(timer)
        }
    }, [])

    if (apiError) {
        return (
            <div id="report">
                <h1>Incident Report</h1>
                <p>{apiError}</p>
            </div>
        )
    }

    if (!incident) {
        return (
            <div id="report">
                <h1>Incident Report</h1>
                <p>Loading report from API...</p>
            </div>
        )
    }

    return (
        <div id="report">
            <h1>Incident Report</h1>

            <p>ID: {incident.id}</p>

            <p>Title: {incident.title}</p>

            <p>Reporter: {incident.reporter}</p>

            <p>Location: {incident.location}</p>

            <p>Date: {incident.date} {incident.time}</p>

            <h2>Authorities</h2>

            <ul>
                {authorities.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>

            <h2>Description</h2>

            <p>{incident.description}</p>
        </div>
    )
}
