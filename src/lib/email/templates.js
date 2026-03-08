const BRAND_COLOR = '#ff5100' // Sidebar orange from Skill.md

const layout = (content) => `
<div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: ${BRAND_COLOR}; margin: 0; font-size: 24px;">Arvela HR</h1>
  </div>

  <div style="color: #333; line-height: 1.6; font-size: 16px;">
    ${content}
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
    &copy; ${new Date().getFullYear()} Arvela HR System. Automated notification.
  </div>
</div>
`

export function getAppliedTemplate({ candidateName, jobTitle, companyName, portalUrl }) {
  const fallbackUrl = portalUrl || 'https://arvela.id/portal/login'
  return layout(`
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #e0e7ff; padding: 15px; rounded: 50%; margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      </div>
      <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Lamaran Diterima!</h2>
      <p style="color: #64748b; font-size: 16px; margin-top: 10px;">Terima kasih telah melamar di ${companyName}</p>
    </div>

    <p>Halo <strong>${candidateName}</strong>,</p>
    <p>Kami telah menerima lamaran kamu untuk posisi <strong>${jobTitle}</strong>. Tim rekrutmen kami saat ini sedang meninjau profil kamu.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 14px; color: #64748b; font-weight: 500;">Pantau Status Lamaran Kamu:</p>
      
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 5px; font-size: 11px; color: #94a3b8;">Jika tombol di bawah tidak dapat diklik, silakan gunakan link berikut:</p>
        <p style="margin: 0; font-size: 12px; color: #4f46e5; word-break: break-all; text-decoration: underline;">${fallbackUrl}</p>
      </div>

      <a href="${fallbackUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Buka Portal Kandidat</a>
      <p style="margin-top: 15px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
        Kamu bisa login kapan saja menggunakan email ini.<br>
        Kami akan mengirimkan notifikasi setiap kali ada perubahan status.
      </p>
    </div>

    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Jika kualifikasi kamu sesuai, kami akan menghubungi kamu untuk tahap selanjutnya. Tetap semangat dan semoga sukses!
    </p>
    `)
}

export function getMagicLinkTemplate({ loginUrl }) {
  return layout(`
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #fef3c7; padding: 15px; border-radius: 50%; margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z"/></svg>
      </div>
      <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Link Login ArvelaHR</h2>
      <p style="color: #64748b; font-size: 16px; margin-top: 10px;">Gunakan link di bawah ini untuk masuk ke akun kamu.</p>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 5px; font-size: 11px; color: #94a3b8;">Jika tombol di bawah tidak dapat diklik, silakan gunakan link berikut:</p>
        <p style="margin: 0; font-size: 12px; color: #4f46e5; word-break: break-all; text-decoration: underline;">${loginUrl}</p>
      </div>

      <a href="${loginUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">Masuk ke Dashboard</a>
      <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
        Link ini akan kadaluwarsa dalam 1 jam.<br>
        Jika kamu tidak merasa meminta link ini, abaikan saja email ini.
      </p>
    </div>
    `)
}

export function getStageUpdateTemplate({ candidateName, jobTitle, companyName, toStage, message, portalUrl }) {
  const stageLabels = {
    screening: 'Screening',
    assessment: 'Assessment (Tes)',
    interview: 'Interview (Wawancara)',
    offering: 'Offering (Penawaran)',
    hired: 'Diterima (Hired)',
    rejected: 'Ditolak (Rejected)'
  }

  const welcomeMessage = toStage === 'rejected'
    ? `<p>Kami ingin memberikan kabar terkait lamaran Anda sebagai <strong>${jobTitle}</strong> di <strong>${companyName}</strong>.</p>`
    : `<p>Ada kabar baru untuk Anda! Lamaran Anda sebagai <strong>${jobTitle}</strong> di <strong>${companyName}</strong> telah berlanjut ke tahap berikutnya: <strong>${stageLabels[toStage] || toStage}</strong>.</p>`

  const customMessage = message ? `<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND_COLOR}; font-style: italic;">"${message}"</div>` : ''

  const fallbackUrl = portalUrl || 'https://arvela.id/portal/login'
  const actionButton = toStage !== 'rejected'
    ? `<div style="margin-top: 20px; text-align: center;">
        <div style="margin-bottom: 20px;">
          <p style="margin-bottom: 5px; font-size: 11px; color: #94a3b8;">Jika tombol di bawah tidak dapat diklik, silakan gunakan link berikut:</p>
          <p style="margin: 0; font-size: 12px; color: ${BRAND_COLOR}; word-break: break-all; text-decoration: underline;">${fallbackUrl}</p>
        </div>
        <a href="${fallbackUrl}" 
           style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
           Buka Portal Kandidat
        </a>
      </div>`
    : ''

  return layout(`
    <p>Halo <strong>${candidateName}</strong>,</p>
    ${welcomeMessage}
    ${customMessage}
    ${toStage === 'rejected'
      ? `<p>Mohon maaf, saat ini kami belum dapat melanjutkan lamaran Anda ke tahap berikutnya. Kami mendoakan yang terbaik for karir Anda di masa mendatang.</p>`
      : `<p>Silakan pantau portal kandidat untuk detail instruksi selanjutnya pada tahap ini.</p>`}
    ${actionButton}
  `)
}

export function getInterviewInvitationTemplate({ candidateName, jobTitle, companyName, date, time, format, linkUrl }) {
  const meetingInfo = format === 'online'
    ? `<p><strong>Link Pertemuan:</strong> <a href="${linkUrl}" style="color: ${BRAND_COLOR};">${linkUrl}</a></p>`
    : (linkUrl ? `<p><strong>Lokasi:</strong> ${linkUrl}</p>` : '')

  return layout(`
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Undangan Wawancara</h2>
      <p style="color: #64748b; font-size: 16px; margin-top: 10px;">${jobTitle} di ${companyName}</p>
    </div>

    <p>Halo <strong>${candidateName}</strong>,</p>
    <p>Selamat! Kami ingin mengundang kamu untuk mengikuti sesi wawancara untuk posisi <strong>${jobTitle}</strong> di <strong>${companyName}</strong>.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">Detail Wawancara:</h3>
      <p><strong>Tanggal:</strong> ${date}</p>
      <p><strong>Waktu:</strong> ${time}</p>
      <p><strong>Format:</strong> ${format === 'online' ? 'Online (Video Conference)' : 'Tatap Muka (Offline)'}</p>
      ${meetingInfo}
    </div>

    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Tolong konfirmasi kehadiran kamu dengan membalas email ini. Jika jadwal ini tidak memungkinkan, beri tahu kami agar kami dapat menyesuaikannya.
    </p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Terima kasih dan semoga sukses!
    </p>
    `)
}

export function getOfferLetterTemplate({ candidateName, jobTitle, companyName, salary, startDate, expiryDate, offerUrl }) {
  return layout(`
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #ecfdf5; padding: 15px; border-radius: 50%; margin-bottom: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Surat Penawaran Kerja (Offer Letter)</h2>
      <p style="color: #64748b; font-size: 16px; margin-top: 10px;">Selamat! Kamu terpilih untuk bergabung dengan ${companyName}</p>
    </div>

    <p>Halo <strong>${candidateName}</strong>,</p>
    <p>Dengan senang hati kami sampaikan bahwa tim rekrutmen kami telah memutuskan untuk menawarkan posisi <strong>${jobTitle}</strong> di <strong>${companyName}</strong> kepada Anda.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">Ringkasan Penawaran:</h3>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Gaji Pokok:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right;">${salary}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Tanggal Mulai:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right;">${startDate}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #64748b;">Batas Waktu:</td>
          <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #ef4444;">${expiryDate || 'N/A'}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 5px; font-size: 11px; color: #94a3b8;">Jika tombol di bawah tidak dapat diklik, silakan gunakan link berikut:</p>
        <p style="margin: 0; font-size: 12px; color: #059669; word-break: break-all; text-decoration: underline;">${offerUrl}</p>
      </div>
      <a href="${offerUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.2);">Lihat & Tanda Tangani Offer Letter</a>
    </div>

    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Harap tinjau dokumen penawaran selengkapnya melalui tombol di atas. Kami sangat menantikan kehadiran Anda sebagai bagian dari tim kami.
    </p>
    `)
}
