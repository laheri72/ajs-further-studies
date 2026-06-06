# Form Engine Strategy (V2 Blueprint)

## Current Implementation Limitations
Currently, the multi-step registration form is heavily hardcoded within `src/pages/StudentPage.jsx` and `src/data/constants.js`.
- **Inflexible:** Adding a single field requires changing the JSX, validation logic, state management, and potentially Firestore Rules.
- **Bloat:** The `StudentPage.jsx` component is oversized, mixing routing, state, and UI.
- **Validation:** Validation is manually maintained in `src/utils/validation.js` instead of utilizing strict, dynamic schemas.

## Future Schema-Driven System (V2)

### 1. Schema Definition
We will move to a JSON-driven form configuration. A master form schema will dictate steps, fields, types, and branching logic.
- **Example Schema Structure:**
  ```json
  {
    "version": "2.0",
    "steps": [
      {
        "id": "qualifications",
        "title": "Qualifications Acquired",
        "fields": [
          {
            "name": "qualifications",
            "type": "multi-select",
            "options": ["Hifz ul Quran", "Dars-e-Nizami", "Other"],
            "required": true
          },
          {
            "name": "otherQual",
            "type": "text",
            "condition": { "field": "qualifications", "contains": "Other" }
          }
        ]
      }
    ]
  }
  ```

### 2. Form Renderer Component
A generic `<FormRenderer schema={currentSchema} />` component will dynamically render inputs based on the schema, drastically reducing boilerplate code and component bloat.

### 3. Validation Layer (Zod)
Since `zod` is already in `package.json`, V2 will dynamically generate Zod schemas based on the JSON form configuration. This ensures that client-side validation matches the required schema perfectly.

### 4. Versioning Strategy
- Form schemas will be versioned (e.g., `v1`, `v2`). 
- Existing `students` documents will tag which form version they were submitted with. 
- This ensures historical records render correctly even if the underlying questions change in a future term.

### 5. Draft/Publish Workflow
- **Admin Side:** Admins can use a drag-and-drop or JSON editor to modify the form schema.
- **Draft Mode:** Form edits are saved as a "draft" schema in Firestore.
- **Publish:** Once finalized, the schema is published and becomes the active version for new student registrations.

## Migration Plan
1. Extract current hardcoded fields into an initial `v1.json` schema.
2. Build the `<FormRenderer>` to handle `v1.json` effectively replicating current behavior.
3. Hook up Zod dynamic validation.
4. Replace the hardcoded `StudentPage` form with the renderer.
5. Deploy and monitor.
6. Begin adding dynamic Admin tools to edit the schema.