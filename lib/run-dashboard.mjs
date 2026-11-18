import { startDashboard } from './dashboard.mjs'
startDashboard({ stateFile: process.env.DSH_TOWN_LIFE_FILE || '' })
console.log('town-dashboard-ready')
