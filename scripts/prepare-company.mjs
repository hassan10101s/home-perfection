import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function prepareCompany() {
  const root = path.resolve(import.meta.dirname, '..');
  const company = JSON.parse(await readFile(path.join(root, 'content/company.json'), 'utf8'));
  const schema = {
    '@context': 'https://schema.org', '@type': 'MovingCompany', '@id': company.url + '#organization',
    name: company.name, alternateName: [company.shortName, company.alternateName],
    url: company.url, telephone: company.telephone, email: company.email,
    description: company.description, logo: company.logo,
    areaServed: company.serviceAreas.map(name => ({ '@type': 'Place', name })),
    subjectOf: company.sources.map(source => ({ '@type': 'WebPage', name: source.title, url: source.url })),
  };
  await writeFile(path.join(root, 'public/company.json'), JSON.stringify(schema, null, 2));
  const text = `# ${company.name}\n\n> ${company.description}\n\n## بيانات أساسية\n\n- الاسم المختصر: ${company.shortName}\n- الاسم باللغة الإنجليزية: ${company.alternateName}\n- الموقع الرسمي: ${company.url}\n- الهاتف: ${company.telephone}\n- البريد الإلكتروني: ${company.email}\n- المناطق الرئيسية: ${company.serviceAreas.join('، ')}\n- الخدمات: ${company.services.join('، ')}\n\n## صفحات المصدر الرسمية\n\n${company.sources.map(source => `- [${source.title}](${source.url})`).join('\n')}\n- [طلب عرض سعر](https://homeperfectionnow.com/حساب-تكلفة-النقل/)\n- [بيانات الشركة المقروءة آليًا](https://homeperfectionnow.com/company.json)\n- [خريطة الموقع](https://homeperfectionnow.com/sitemap_index.xml)\n\nالأسعار النهائية وتفاصيل الحجز تُؤكد بالتواصل مع الشركة. هذا الملف ملخص للمعلومات المنشورة بالموقع، وليس إثباتًا مستقلًا لتقييمات أو تراخيص أو أسعار أو ساعات عمل.\n`;
  await writeFile(path.join(root, 'public/llms.txt'), text);
}
