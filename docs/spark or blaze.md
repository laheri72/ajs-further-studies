
**Step 1: What you want**
You want the portal to send an automatic email to the student when an admin:
- approves a request,
- rejects a request,
- or saves a review note/status change.

That is absolutely possible in principle, but not safely from the browser alone.

**Step 2: The real technical shape**
The clean architecture is:
1. Admin updates request in Firestore.
2. A backend trigger detects the change.
3. The backend sends an email to the student’s education email.

That backend trigger is the important part. It should not live in the React frontend, because then your mail provider credentials are exposed and users can abuse them.

**Step 3: Can you do it for free?**
Yes, but with tradeoffs.

Free-only options exist, but they are weaker:
- A client-side email service like EmailJS or a similar free-tier provider can send mail without Firebase Functions.
- This is okay for tiny prototypes.
- It is not ideal for an admin workflow system because secrets, deliverability, spam protection, retries, and audit logs are weak.

If you want the portal to be reliable and professional, free-only is usually not the right long-term answer.

**Step 4: What Blaze actually gives you**
Blaze is not “free,” but it is pay-as-you-go and unlocks the backend layer you need.

For your use case, Blaze mainly enables:
- Cloud Functions for Firebase.
- Firestore-triggered automation.
- Scheduled jobs.
- Firebase Extensions like “Trigger Email from Firestore.”
- Secure server-side secret handling.
- Cleaner email audit logging and retry logic.

It does not magically create email sending by itself. You still need an email provider such as:
- SendGrid,
- MailerSend,
- Resend,
- Mailgun,
- or another transactional email service.

Many of those have free tiers, but the Firebase side that triggers them is what usually pushes you toward Blaze.

**Step 5: What you can benefit from Blaze in your situation**
For your portal specifically, the useful benefits are:

- Automatic transactional emails from Firestore events.
- Secure status-based notifications for approve/reject/save-review flows.
- Server-side logic for PDFs, image processing, or file workflows later.
- Firebase Extensions support, including “Trigger Email from Firestore.”
- Better future-proofing if you later add reminders, escalations, or scheduled notifications.
- Ability to keep business logic off the client.
- More flexibility if the portal grows into a real operations system.

What you do not gain automatically:
- Unlimited free usage.
- Unlimited storage.
- Free attachment sending.
- Free email volume at scale.
- No-cost forever.

**Step 6: Important limitations**
If you stay strictly free, these are the main limits:
- You cannot safely do proper server-triggered transactional email with Firebase alone on Spark.
- Client-side email sending is risky and easier to abuse.
- Free email providers often limit volume, branding, attachments, or deliverability.
- If you need PDF/image attachments in emails, the complexity and cost go up.
- If admins edit the same request multiple times, you must avoid duplicate emails.

**Step 7: Edge cases you should plan for**
These matter a lot in an admin portal:

- Duplicate notifications  
  If admin saves the same status twice, the student should not get two emails unless you want that.

- Save without status change  
  If admin only changes remarks, decide whether that should send mail or not.

- Missing or invalid student email  
  If the education email is missing or wrong, the notification should fail gracefully.

- Bounced emails  
  Some student accounts may not receive mail, so you should log delivery failures.

- Spam/abuse risk  
  Never let the client directly call your email provider with private credentials.

- Audit trail  
  Store a notification log like “sent at”, “sent type”, “delivery status”, “retry count”.

**Step 8: Does your current setup need Blaze now?**
My advice: not yet, if “strict free” is your top priority.

Your current portal can stay on Spark for:
- Hosting,
- Firestore,
- Auth,
- basic storage within limits.

Blaze becomes necessary when you want:
- real automatic backend email triggers,
- secure review notifications,
- future automation,
- Extensions-based workflows,
- better operational maturity.

So for now, your setup does not need Blaze to keep working.  
But for automatic admin-to-student email alerts, Blaze is the correct long-term foundation.

**Professional recommendation**
If you want the strongest answer:

- Stay on Spark if you want to spend $0 and can live without proper automated transactional email.
- Upgrade to Blaze if you want a serious portal with reliable approval/rejection emails and backend automation.
- Do not rely on pure frontend email sending for a production admin system.
- If you upgrade, keep usage low and set budget alerts immediately so “pay-as-you-go” stays near zero.

**Final verdict**
Yes, you can build this feature.  
For a real admin workflow, the right solution is Firestore-triggered backend email sending, which means Blaze is the practical choice.  
For a fully free setup, you can prototype with a third-party free email service, but it will be less secure and less professional.

If you want, I can next give you a simple “Spark vs Blaze vs third-party email” comparison table tailored to your portal.