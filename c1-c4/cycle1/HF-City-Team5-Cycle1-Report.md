# HF City Team 5 – Cycle 1 UX Design Report 

## 1. User Personas

### Persona 1

    Name: Sarah
    Age: 33
    Occupation: Adelaide Primary School Art Teacher
    Location: Adelaide Suburbs

### Persona Images
![Persona1 Sarah](/c1-c4/cycle1/imgs/Persona_Sarah.png)
> Persona_Sarah.png is stored under `./imgs/` for traceability.

#### Technology Profile:
* Uses laptop at work and smartphone daily;
* Familiar with Google Maps, YouTube for lesson ideas;
* Prefers simple, visual-based platforms without any jargon.

#### Background:

Sarah is a primary school art teacher. In her teaching plan for this semester, she needs to design courses to help students better understand the Aboriginal culture of Australia. She hopes that while imparting art skills, she can also help students establish a sense of identity with indigenous cultures. She hopes to find real and teaching-suitable Art cases through the Indigenous Art Atlas website and arrange class field trips. She needs to plan the courses based on this website, so the website should have the characteristics of being efficient to use, reliable in information and oriented towards educators.

#### Goals: 
* Search for cases of indigenous art works suitable for teaching;
* Display information, pictures of artworks and cultural backgrounds in the class;
* Through the map, teachers can find places suitable for students to visit local art works and have cultural discussions;
* The interface and content can stimulate students' interest in art.

#### Needs:
* Homepage: Include interactive Map function, teachers can quickly find artworks that are open for public viewing near the school;
* Category filtering: It can be filtered by type (carving, mural, traditional craftsmanship) or time;
* Art content Page: Concise and understandable work descriptions and background information;
* Printable/shareable: Convenient for bringing work information into classroom demonstrations;
* Usage Guidelines page: Help teachers convey cultural respect and sensitivity.

#### Pain Points
* It is difficult to collect teaching resources and it is hard to find high-quality indigenous art content
* The resource platform is not updated fast enough to meet the teaching course schedule
* Sometimes, technical tools are overly complex, which affects teaching efficiency

#

### Persona 2
    Name: Jason
    Age: 42
    Occupation: Indigenous muralist & storyteller
    Location: Regional South Australia

### Persona Images
![Persona2 Jason](/c1-c4/cycle1/imgs/Persona_Jason.png)
> Persona_Jason.png is stored under `./imgs/` for traceability.

#### Technology Profile:
* Use social media (Facebook, Instagram) on smartphone;
* Hope the steps for uploading pictures can be simple and easy to operate
* Weak internet connectivity in remote areas

#### Background:
Jason is an indigenous artist who documents the stories and cultures of indigenous communities through murals and handicrafts. He hopes to display his works online, allowing more people to see his creations and at the same time protect the culture from being misused. He values cultural sensitivity and does not wish for art to be commercialized or disseminated deviated from its original meaning. He has very high requirements for the security and respectful attitude of the platform and hopes that the uploaded works can retain complete cultural background explanations.

#### Goals: 
* Be able to upload artworks and introduce their story backgrounds;
* A personal profile page can be established to facilitate artists in showcasing their works;
* Gain recognition from the community and the public, and be able to exchange and discuss cultural works through the platform.

#### Needs:
* Information submission sensitivity control: You can freely choose to hide the exact location of the work to protect the artist's privacy;
* Position sensitivity control: It allows you to freely choose to hide or blur the exact position of the work;
* Artist's personal profile page: It can display personal works and self-introductions in a centralized manner;
* Multilingual support: Capable of multilingual conversion, facilitating browsing by people from diverse cultural backgrounds;
* Web page security: Respect cultural sensitivity. The network environment should be stable and convenient for uploading works. There should be a privacy protection mechanism for user downloads.

#### Pain points
* Worried that his artworks might be misused when disseminated on the platform.
* Concerns that the works may lack security mechanisms when displayed online, leading to unauthorized use.
* There is concern that the platform may overlook the background and sensitivity of indigenous cultures when presenting works.

## 2. Key User Tasks and Flows

### Task 1: Admin makes changes to a user
- Description: In this task, admin wants to change a user's role or his account's status like deleting one's account. First, the admin enters the URL for the admin dashboard page and visits it. Second, when the admin clicks 'user management' button to reach the page where he can search for a user, he needs to log in first. Third, he should enter key words to search for a user and then the admin will be able to see the search result and try to change the role or the user's status.
- Flow diagram: ![Task 1 Flow](./imgs/AdminUserFlow(a).png)

### Task 2: Admin reviews submissions and moderation queue
- Description: In this task, admin wants to review the submissions coming from users and the reports generated from users about the inaccurate content. First, the admin enters the URL for the admin dashboard page and visit it. Second, if the admin wants to review the submissions, he should click a button like 'Go to all the submissions'. If the admin has not logged in, then log in. In the submission list page, for each submission, the admin can click it and view all the info written by the user. Admin can edit details of the submission, including the location. Third, if the admin wants to see the moderation queue, then click a link to see all the reports. Similarly, the admin can click each report to see the details. In the details page, admin can do necessary actions to the content if it does not meet the policy or requirements. Also, admin can edit art_types here.
- Flow diagram: ![Task 2 Flow](./imgs/AdminUserFlow(b).png)

### Task 3: Artist update bio/provide contact info
- Description: In this task, the artist wants to provide contact info or update his bio on the website. First, the artist needs to log in. Then, he should click his profile and get into that page. This profile page for artist should be a bit different from the profile page for general users as artist can set bio here, update contact info and view all the art entries attributed to him. When artist reaches this profile page, it is read only until he clicks the edit button. When the artist is satisfied with the changes, he can click save button and then he will be redirected back the his read-only profile page.
- Flow diagram: ![Task 3 Flow](./imgs/ArtistFlow.png)

### Task 4: general users and artists submit their arts and manage their submissions
- Description: In this task, the artist and other general users want to upload their arts. First of all, they go to the home page of the website and click my profile. In this step, if they have not logged in yet, they will be redirected to the log in page. They will be able to click the sign up link to register for an account if they do not have one. When the user logs in successfully, he will see his user profile page. Second, the user shall see all his submissions here and their status. If the user wants to manage his submissions, he can click any one and reach to its detail page to make changes but the edited version should be assessed again. Besides, the user can click the 'submit my art' button to create a new submission. After entering the details, picking a location and credit an artist, the user can go to the submission confirmation page. After passing the front-end JavaScript validation, the user will be able to confirm this submission form.
- Flow diagram: ![Task 4 Flow](./imgs/GeneralUserFlow(a).png)

### Task 5: logged in and unlogged in users browsing the arts on the website
- Description: In this task, all the users including logged in and unlogged in users want to browse the arts on the website. First, they should reach the homepage. Here, they can visit the about page, usage guideline page and ethical consideration page by clicking the link. When the user clicks a marker on the interactive map, he will be directed to a page where he can see a list of arts in this area. In this page, the user can search, filter the results if he wants. Then, the user can click any art to see its details. All the details shown on this detail page come from the user who submitted this art. Finally, there will be a report button for logged in users only to report the inaccurate content. A list of common options are provided such as "artist does not match", "location is wrong" and so on.
- Flow diagram: ![Task 5 Flow](./imgs/GeneralUserFlow(b).png)

## 3. Information Architecture (Sitemap)

Provided collaboratively.

Provide a visual sitemap representing the structure of your website.

![Sitemap](./imgs/sitemap.png)

## 4. Low-Fidelity Wireframes

### Wireframe 1 – Homepage (FlowDiagram 9.0)

The homepage is the main entry for all to display a visually appealing introduction to the "Indigenous Art Atlas.", public visitor can browse arts listings and filter their preference. The first part is a banner to show the Atlas profile with an abstract introduction. There is a prominent interactive map showcasing approved art locations under the banner. And then, featured arts showcase a selection of recently added or featured art entries with details includes title, description and author avatar. At the bottom part, there are many quick links include links to "About Us," "Usage Guidelines," and "Contact Us" pages.

![Wireframe Home](../../project-docs/drafts/c1/WireframesHomepage.png)

### Wireframe 2 – Login Page (FlowDiagram 7.0)

The website is redirect to login page when visitor click the login button. The login feature requires visitor's email and password to authenticate the identity. And visitors can start registration here by click the link of sign up if they don't have an account. 

![Wireframe Login](../../project-docs/drafts/c1/WireframesLogin.png)

### Wireframe 3 – Art Listings (FlowDiagram 9.1)

There is a dedicated page displaying all approved art entries in a gallery or list format. Each item display a thumbnail image, title, and a brief description. Visitor can fliter the arts by several options, and the default sorting method is by added date.

![Wireframe Art Listings](../../project-docs/drafts/c1/WireframesArtListings.png)

### Wireframe 4 – Art Details (FlowDiagram 13.0)

Each art entry have a unique page in the art detail pages, displaying all submitted details. At first, a carousel shows multiple high-resolution images of the art. Under that, left side is static map snippet showing the art's specific or general location (respecting sensitivity), and right side is comprehensive description, art type, estimated period, condition notes. After the map and description, the artist information with name and submission date is showed in the last part if the author isn't anonymous.

![Wireframe Art Details](../../project-docs/drafts/c1/WireframesArtDetails.png)

### Wireframe 5 – Art Submission (FlowDiagram 8.0)

The art submission design is a multi-step or multi-section form accessible only to logged-in users. Users can start a submission with the artwork’s title, description, select predefined categories for type and period, and add condition notes. They may also credit a known artist and link submissions to an artist profile when applicable. Location information is captured through an interactive map (Leaflet.js) that allow users to drop a pin and get latitude/longitude coordinates. A sensitivity flag is included to mark culturally sensitive or private land locations for admin review and potential public masking. The form also supports multiple image uploads (JPEG, PNG) with server-side file validation for type and size.

![Wireframe Art Submission](../../project-docs/drafts/c1/WireframesArtSubmission.png)

## 5. Accessibility and Usability Considerations

Provided collaboratively.

List 3–5 design features supporting accessibility and usability.

## 6. Design Rationale

Written by **Member A – Rationale Writer**

Explain major design decisions and how they address personas’ goals and usability principles.

## 7. User Research and Evidence

Written by **Member A**

Briefly explain what user research methods were used and what insights were gained.

## 8. Known Limitations and Future Improvements

Written by **Member D – Project Coordinator**

List current limitations and outline what will be improved in Cycle 2.

## 9. Team Contributions

Coordinated by **Member D – Project Coordinator & Git Manager**

| Name       | Role                          | Contributions                            |
|------------|-------------------------------|-------------------------------------------|
| A          | User Research & Rationale     | Personas, needs analysis, rationale       |
| B          | User Flow Designer            | Task flows, logic diagrams                |
| C          | Wireframe Designer            | Page wireframes with annotations          |
| D (Leader) | Project Coordinator & Git     | Git setup, report integration, final review |

## 10. AI Acknowledgment (if used)

State any AI tools used and include Appendix A if applicable.

## Appendix A – AI Prompt History (If applicable)

Include full prompt history and outputs here.