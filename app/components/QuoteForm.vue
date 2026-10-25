<script setup lang="ts">
const form = reactive({ from: '', fromFloor: 'أرضي', to: '', toFloor: 'أرضي', rooms: '1', method: 'باستخدام المصعد', packing: 'لا أحتاج إلى تغليف', extras: [] as string[], details: '', phone: '' })
const floors = ['أرضي', '1', '2', '3', '4', '5', '6', '7 فأكثر']
const extras = ['فني فك وتركيب / نجار', 'فني تكييف', 'فني كهربائي', 'أخصائي رش مبيدات', 'عامل نظافة']
const error = ref('')
function submit() {
  const phone = form.phone.replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[\s()-]/g, '')
  if (!/^(?:\+?\d{8,15})$/.test(phone)) { error.value = 'برجاء كتابة رقم جوال صحيح.'; return }
  error.value = ''
  const message = ['مرحبًا، أريد عرض سعر لنقل العفش:', `مكان التحميل: ${form.from}`, `طابق التحميل: ${form.fromFloor}`, `مكان التنزيل: ${form.to}`, `طابق التنزيل: ${form.toFloor}`, `عدد الغرف: ${form.rooms}`, `طريقة النقل: ${form.method}`, `التغليف: ${form.packing}`, `خدمات إضافية: ${form.extras.join('، ') || 'لا يوجد'}`, `التفاصيل: ${form.details || 'لا يوجد'}`, `رقم الجوال: ${phone}`].join('\n')
  window.open(`https://wa.me/966565964755?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}
</script>
<template>
  <section class="hp-quote" aria-labelledby="quote-title">
    <h2 id="quote-title">اطلب حساب تكلفة النقل</h2>
    <p>املأ التفاصيل لطلب عرض سعر. سيفتح واتساب لمراجعة الرسالة وإرسالها بنفسك.</p>
    <form @submit.prevent="submit">
      <div class="hp-form-grid">
        <label>مكان المنزل القديم (التحميل)<input v-model.trim="form.from" required maxlength="250" autocomplete="off"></label>
        <label>الطابق في الموقع القديم<select v-model="form.fromFloor"><option v-for="floor in floors" :key="floor">{{ floor }}</option></select></label>
        <label>مكان المنزل الجديد (التنزيل)<input v-model.trim="form.to" required maxlength="250" autocomplete="off"></label>
        <label>الطابق في الموقع الجديد<select v-model="form.toFloor"><option v-for="floor in floors" :key="floor">{{ floor }}</option></select></label>
        <label>عدد الغرف<select v-model="form.rooms"><option v-for="room in ['قطع بسيطة', 'مجالس فقط', '1', '2', '3', '4', '5', '6', '7 فأكثر']" :key="room">{{ room }}</option></select></label>
        <label>طريقة النقل<select v-model="form.method"><option v-for="method in ['طابق أرضي', 'باستخدام الدرج (1–3 طوابق)', 'باستخدام الدرج (4–6 طوابق)', 'باستخدام المصعد', 'باستخدام الونش', 'توجد معوقات سأذكرها في التفاصيل']" :key="method">{{ method }}</option></select></label>
        <label>خدمات التغليف<select v-model="form.packing"><option v-for="packing in ['لا أحتاج إلى تغليف', 'تغليف شامل وكامل للعفش', 'تغليف الأجهزة المنزلية فقط', 'تغليف مخصص سأذكره في التفاصيل']" :key="packing">{{ packing }}</option></select></label>
        <label>رقم الجوال<input v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" required dir="ltr" aria-describedby="phone-error"></label>
      </div>
      <fieldset><legend>خدمات إضافية</legend><label v-for="extra in extras" :key="extra" class="hp-checkbox"><input v-model="form.extras" type="checkbox" :value="extra">{{ extra }}</label></fieldset>
      <label>التفاصيل<textarea v-model.trim="form.details" rows="4" maxlength="2000" /></label>
      <p v-if="error" id="phone-error" role="alert">{{ error }}</p>
      <button type="submit">متابعة طلب التسعير عبر واتساب</button>
      <p class="hp-form-note">لا يتم إرسال البيانات تلقائيًا أو حفظها في الموقع. السعر النهائي بعد مراجعة تفاصيل الطلب.</p>
    </form>
  </section>
</template>
