const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace('policies      Policy[]\r\n', 'policies      Policy[]\r\n  clients       Client[]\r\n');
schema = schema.replace('policies      Policy[]\n', 'policies      Policy[]\n  clients       Client[]\n');

const newModels = model Client {
  id            String    @id @default(cuid())
  name          String
  email         String?
  phone         String?
  birthDate     DateTime?
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  policies      Policy[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Policy {
  id                    String    @id @default(cuid())
  
  policyNumber          String    @unique
  contractor            String?   // Contratante
  insured               String?   // Asegurado
  
  product               String?
  insuranceCompany      String?
  
  effectiveDate         DateTime?
  renewalDate           DateTime?
  anniversaryDay        Int?
  anniversaryMonth      Int?
  
  annualPremium         Float?    @default(0)
  paymentMethod         String?
  
  approximateCommission Float?    @default(0)
  approximateBonus      Float?    @default(0)
  
  observations          String?
  
  pdfUrl                String?   // Vercel Blob URL
  
  clientId              String?
  client                Client?   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  userId                String
  user                  User      @relation(fields: [userId], references: [id])
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
};

schema = schema.replace(/model Policy \{[\s\S]*?\}/, newModels);

fs.writeFileSync('prisma/schema.prisma', schema);
