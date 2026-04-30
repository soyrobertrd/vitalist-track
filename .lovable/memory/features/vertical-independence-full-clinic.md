---
name: Vertical Independence - Full Clinic Modules
description: Each vertical (VisionCare, DentalCare, AestheticPro, RecoveryCare) includes full clinic ops: pacientes, citas, personal, facturación, nómina
type: feature
---
## Vertical Modules as Standalone Products

Each vertical includes shared clinic tabs via reusable components in `src/components/vertical/`:
- **VerticalPacientesTab** — Patient registration and search
- **VerticalCitasTab** — Appointment scheduling with patient/professional selectors
- **VerticalPersonalTab** — Staff management with configurable specialties and labels
- **VerticalFacturacionTab** — Invoicing and payment collection
- **VerticalNominaTab** — Payroll calculation (SFS/AFP DR rates)

## Vertical-Specific Configurations

### VisionCare Pro (`/vision-care`)
- Doctors: Oftalmología, Optometría, Contactología, Cirugía refractiva
- Can be independent doctors

### DentalCare Pro (`/dental-care`)
- Doctors: Odontología general, Ortodoncia, Endodoncia, Periodoncia, etc.
- Can be independent doctors

### Aesthetic Pro (`/aesthetic-pro`)
- Staff label: "Enfermeras / Terapeutas"
- Specialties: Masaje linfático, Radiofrecuencia, Cavitación, etc.
- Can be independent nurses/aestheticians

### Recovery Care (`/recovery-care`)
- Staff: Enfermería, Fisioterapia, Cuidado postquirúrgico, Concierge médico
- Full postoperative recovery house management
