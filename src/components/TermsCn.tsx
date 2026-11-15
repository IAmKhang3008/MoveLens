import React from 'react';
import { motion } from 'motion/react';

export default function TermsCn() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#0B0C10] px-3 py-5 sm:p-6 md:p-12 scrollbar-thin scrollbar-thumb-neutral-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-[#13151A] border border-neutral-800/50 rounded-2xl p-5 sm:p-6 md:p-10 shadow-2xl break-words [overflow-wrap:anywhere]"
      >
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">条款和条件</h1>
        <p className="text-sm text-neutral-400 mb-8">最后更新于 2026 年 7 月 23 日</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">1. 同意我们的法律条款</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">我们是 Khang Vu，以 MoveLens（“公司”、“我们”、“我们的”）名义开展业务，一家在越南注册的公司，地址位于 __________，胡志明市，越南。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们运营网站 movelenstool.vercel.app（“本网站”），以及引用或链接至这些法律条款（“法律条款”）的任何其他相关产品和服务（统称为“服务”）。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">MoveLens 是一个免费的在线国际象棋对局复盘工具。用户可以粘贴他们的国际象棋对局（PGN 格式）以接收针对其移动的自动分析。平台使用标准的国际象棋注释符号来突出显示精彩着法、好着、最佳着法、不精确、错误和漏着。无需注册账号。所有分析均直接在用户的浏览器中运行。MoveLens 由自愿捐赠支持，并可能显示非侵入式广告。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">您可以通过电子邮件联系我们，邮箱为 movelens@proton.me，或通过邮件联系我们，地址为 __________，胡志明市，越南。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">这些法律条款构成您（无论是个人身份还是代表实体，“您”）与 Khang Vu 之间关于您访问和使用本服务的具有法律约束力的协议。您同意，通过访问本服务，您已阅读、理解并同意受所有这些法律条款的约束。如果您不同意所有这些法律条款，则明确禁止您使用本服务，您必须立即停止使用。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">对本条款的更新将发布在本页面上，并标有修改后的“最后更新”日期。建议用户定期查看此页面以了解任何更改。在发布更新后继续使用 MoveLens 构成对修订后条款的接受。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">在其居住的司法管辖区内未成年（通常未满 18 岁）的所有用户，必须获得其父母或监护人的许可并在其直接监督下才能使用本服务。如果您是未成年人，您必须让您的父母或监护人在您使用本服务之前阅读并同意这些法律条款。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们建议您打印一份这些法律条款以供记录。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">1. 我们的服务</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">使用服务时提供的信息不旨在分发给在任何司法管辖区或国家/地区的任何个人或实体使用，如果这种分发或使用违反法律或法规，或会使我们在该司法管辖区或国家/地区内受到任何注册要求的约束。因此，那些选择从其他地点访问本服务的人是出于自愿，并且完全负责遵守当地法律（如果并且在当地法律适用的范围内）。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">本服务并非专为符合行业特定法规（健康保险流通与责任法案（HIPAA）、联邦信息安全管理法案（FISMA）等）而定制，因此如果您的互动受此类法律约束，您可能无法使用本服务。您不得以违反《格雷姆-里奇-比利雷法案》（GLBA）的方式使用本服务。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">2. 知识产权</h2>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">我们的知识产权</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">我们是本服务中所有知识产权的所有者或被许可方，包括所有源代码、数据库、功能、软件、网站设计、音频、视频、文本、照片和图形（统称为“内容”），以及其中包含的商标、服务标志和徽标（“标志”）。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们的内容和标志受美国和世界各地的版权和商标法（以及各种其他知识产权和反不正当竞争法）和条约的保护。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">内容和标志通过本服务按“原样”提供，仅供您个人非商业用途或内部业务用途。</p>

        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">您对我们服务的使用</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">在您遵守这些法律条款（包括以下“禁止活动”部分）的前提下，我们授予您一项非排他性、不可转让、可撤销的许可，以便：</p>
        <ul className="mb-4">
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">访问本服务；以及</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">下载或打印您已合法访问的任何内容的副本，</li>
        </ul>
        <p className="text-neutral-400 leading-relaxed mb-4">仅供您的个人、非商业用途或内部业务目的。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">除本节或我们法律条款其他部分明确规定外，未经我们明确的事先书面许可，不得出于任何商业目的复制、转载、聚合、重新发布、上传、发布、公开展示、编码、翻译、传输、分发、出售、许可或以其他方式利用本服务的任何部分以及任何内容或标志。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">如果您希望以本节或我们法律条款中未规定的方式使用本服务、内容或标志，请将您的请求发送至：movelens@proton.me。如果我们授予您发布、复制或公开展示我们服务或内容任何部分的许可，您必须确认我们是服务、内容或标志的所有者或被许可人，并确保在发布、复制或展示我们的内容时出现或可见任何版权或所有权声明。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们保留未在服务、内容和标志中明确授予您的所有权利。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">任何违反这些知识产权的行为将构成对我们法律条款的重大违反，您使用我们服务的权利将立即终止。</p>

        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">您的提交和贡献</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">在使用我们的服务之前，请仔细阅读本节和“禁止活动”部分，以了解当您通过服务发布或上传任何内容时，(a) 您赋予我们的权利以及 (b) 您承担的义务。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">提交内容：通过直接向我们发送关于服务的任何问题、评论、建议、想法、反馈或其他信息（“提交内容”），您同意将此类提交内容的所有知识产权转让给我们。您同意我们应拥有该提交内容，并有权将其用于任何合法目的，无论是商业用途还是其他用途，而无需向您确认或补偿。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">贡献：本服务可能邀请您聊天、参与博客、留言板、在线论坛和其他功能，在此期间，您可以创建、提交、发布、展示、传输、发表、分发或广播向我们或通过服务提供的内容和材料，包括但不限于文本、文字、视频、音频、照片、音乐、图形、评论、评论、评级建议、个人信息或其他材料（“贡献”）。任何公开发布的提交内容也将被视为贡献。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">您理解，本服务的其他用户可能可以看到贡献，也可能通过第三方网站看到。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">当您发布贡献时，您授予我们许可（包括使用您的姓名、商标和徽标）：通过发布任何贡献，您授予我们不受限制、无限制、不可撤销、永久的、非排他性的、可转让的、免版税的、已全额支付的全球权利和许可，以：使用、复制、重制、分发、出售、转售、发布、广播、重命名、存储、公开表演、公开展示、重新格式化、翻译、摘录（全部或部分）并利用您的贡献（包括但不限于您的图像、姓名和声音）用于任何目的，无论是商业、广告还是其他目的，以准备衍生作品或纳入其他作品您的贡献，并再许可本节授予的许可。我们的使用和分发可能发生在任何媒体格式和通过任何媒体渠道。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">此许可包括我们使用您的姓名、公司名称和特许经营名称（如适用）以及您提供的任何商标、服务标志、商品名称、徽标以及个人和商业图像。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">您对您发布或上传的内容负责：通过向我们发送提交内容和/或通过服务的任何部分发布贡献，或通过将您在服务中的帐户连接到您的任何社交网络帐户来使贡献可通过服务访问，您：</p>
        <ul className="mb-4">
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">确认您已阅读并同意我们的“禁止活动”，并且不会通过本服务发布、发送、发表、上传或传输任何违法、骚扰、仇恨、有害、诽谤、淫秽、欺凌、虐待、歧视、威胁任何个人或群体、色情、虚假、不准确、欺骗或误导的提交内容或贡献；</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">在适用法律允许的范围内，放弃对此类提交内容和/或贡献的任何及所有精神权利；</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">保证任何此类提交内容和/或贡献是您原创的，或者您拥有提交此类提交内容和/或贡献所需的权利和许可，并且您有权授予我们与您的提交内容和/或贡献相关的上述权利；以及</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">保证并声明您的提交内容和/或贡献不构成机密信息。</li>
        </ul>
        <p className="text-neutral-400 leading-relaxed mb-4">您对您的提交内容和/或贡献负全部责任，并明确同意补偿我们因您违反 (a) 本节、(b) 任何第三方的知识产权或 (c) 适用法律而可能遭受的任何和所有损失。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们可能会删除或编辑您的内容：尽管我们没有义务监控任何贡献，但如果我们合理地认为此类贡献有害或违反了这些法律条款，我们有权随时删除或编辑任何贡献，恕不另行通知。如果我们删除或编辑任何此类贡献，我们也可能暂停或禁用您的帐户并向当局举报您。</p>

        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">侵犯版权</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">我们尊重他人的知识产权。如果您认为本服务上或通过本服务提供的任何材料侵犯了您拥有或控制的任何版权，请立即参阅下面的“版权侵权”部分。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">3. 用户声明</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">通过使用本服务，您声明并保证：(1) 您具有法律行为能力并且您同意遵守这些法律条款；(2) 在您居住的司法管辖区内，您不是未成年人，或者如果是未成年人，您已获得父母同意使用本服务；(3) 您不会通过自动或非人工方式（无论是通过机器人、脚本还是其他方式）访问本服务；(4) 您不会将本服务用于任何非法或未经授权的目的；(5) 您对本服务的使用不会违反任何适用的法律或法规。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">如果您提供任何不真实、不准确、非最新或不完整的信息，我们有权暂停或终止您的帐户，并拒绝您当前或未来对本服务（或其任何部分）的任何及所有使用。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">4. 禁止活动</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">除我们提供本服务的目的外，您不得出于任何其他目的访问或使用本服务。本服务不得用于任何商业活动，除非得到我们的特别认可或批准。</p>
        
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">作为本服务的用户，您同意不：</h3>
        <ul className="mb-4">
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">系统地从本服务检索数据或其他内容，以未经我们书面许可直接或间接创建或编译集合、汇编、数据库或目录。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">欺骗、诈骗或误导我们及其他用户，特别是在任何试图获取敏感账户信息（如用户密码）的尝试中。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">规避、禁用或以其他方式干扰本服务的安全相关功能，包括防止或限制使用或复制任何内容或限制对本服务和/或其中包含的内容的使用之功能。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">在我们看来，贬低、玷污或以其他方式损害我们和/或本服务。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">使用从本服务获取的任何信息以骚扰、虐待或伤害他人。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">不当使用我们的支持服务，或提交关于滥用或不当行为的虚假报告。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">以违反任何适用法律或法规的方式使用本服务。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">参与未经授权的框架化或链接至本服务。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">上传或传输（或试图上传或传输）病毒、特洛伊木马或其他材料，包括过度使用大写字母和刷屏（持续发布重复文本），以干扰任何一方不受干扰地使用和享受本服务，或修改、损害、中断、改变或干扰本服务的使用、特性、功能、操作或维护。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">参与系统的任何自动使用，例如使用脚本发送评论或消息，或使用任何数据挖掘、机器人或类似的数据收集和提取工具。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">从任何内容中删除版权或其他所有权声明。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">试图冒充其他用户或个人，或使用其他用户的用户名。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">上传或传输（或试图上传或传输）任何作为被动或主动信息收集或传输机制的材料，包括但不限于清晰图形交换格式（“gifs”）、1×1像素、网络臭虫、cookie 或其他类似设备（有时称为“间谍软件”或“被动收集机制”或“pcms”）。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">干扰、破坏或对本服务或连接到本服务的网络或服务造成不合理的负担。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">骚扰、惹恼、恐吓或威胁为向您提供本服务任何部分而参与的任何我们的员工或代理。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">试图绕过本服务旨在防止或限制访问本服务或本服务任何部分的任何措施。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">复制或改编本服务的软件，包括但不限于 Flash、PHP、HTML、JavaScript 或其他代码。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">除适用法律允许的情况外，对包含在本服务中或以任何方式构成本服务一部分的任何软件进行解密、反编译、反汇编或反向工程。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">除标准搜索引擎或互联网浏览器使用可能导致的结果外，使用、启动、开发或分发任何自动系统，包括但不限于访问本服务的任何蜘蛛、机器人、作弊实用程序、爬虫或离线阅读器，或使用或启动任何未经授权的脚本或其他软件。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">使用采购代理或采购代理在服务上进行购买。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">对本服务进行任何未经授权的使用，包括通过电子或其他方式收集用户的用户名和/或电子邮件地址，以便发送未经请求的电子邮件，或通过自动方式或虚假借口创建用户帐户。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">将本服务用作与我们竞争的任何努力的一部分，或以其他方式将本服务和/或内容用于任何创收企业或商业企业。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">使用本服务做广告或提供销售商品和服务。</li>
        </ul>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">5. 用户生成的贡献</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">本服务可能邀请您聊天、参与博客、留言板、在线论坛和其他功能，并可能为您提供创建、提交、发布、展示、传输、表演、发表、分发或广播向我们或在服务上提供的内容和材料的机会，包括但不限于文本、文字、视频、音频、照片、图形、评论、建议、或个人信息或其他材料（统称为“贡献”）。贡献可能被服务的其他用户和第三方网站看到。因此，您传输的任何贡献可能会被视为非机密和非专有。当您创建或提供任何贡献时，您即声明并保证：</p>
        <ul className="mb-4">
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您贡献的创建、分发、传输、公开展示或表演，以及访问、下载或复制，不会也不会侵犯任何第三方的专有权利，包括但不限于版权、专利、商标、商业秘密或精神权利。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您是您的贡献的创作者和所有者，或者拥有必要的许可、权利、同意、弃权和许可，以使用并授权我们、本服务和本服务的其他用户以本服务和这些法律条款所考虑的任何方式使用您的贡献。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您已获得您的贡献中每一位可识别个人的书面同意、弃权和/或许可，以使用每一位可识别个人的姓名或肖像，从而能够以本服务和这些法律条款所考虑的任何方式包含和使用您的贡献。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不虚假、不准确或具有误导性。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不是未经请求或未经授权的广告、促销材料、传销、连锁信、垃圾邮件、群发邮件或其他形式的招揽。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不是淫秽、下流、好色、肮脏、暴力、骚扰、诽谤、中伤或以其他方式令人反感（由我们决定）。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不嘲笑、嘲弄、贬低、恐吓或虐待任何人。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不被用于骚扰或威胁（在这些术语的法律意义上）任何其他个人，以及宣传对特定人或特定人群的暴力。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不违反任何适用的法律、法规或规则。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不侵犯任何第三方的隐私权或公开权。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不违反任何适用的有关儿童色情的法律，或旨在保护未成年人健康或福祉的法律。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不包含任何与种族、国籍、性别、性偏好或身体残疾有关的攻击性评论。</li>
          <li className="text-neutral-400 leading-relaxed mb-2 ml-4 list-disc">您的贡献不会以其他方式违反或链接到违反这些法律条款的任何规定或任何适用法律或法规的材料。</li>
        </ul>
        <p className="text-neutral-400 leading-relaxed mb-4">任何违反上述规定的本服务使用均违反了这些法律条款，并可能导致终止或暂停您使用本服务的权利等后果。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">6. 贡献许可</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">通过向本服务的任何部分发布您的贡献，您自动授予，并声明并保证您有权授予我们无限制的、无约束的、不可撤销的、永久的、非排他性的、可转让的、免版税的、全额付清的、全球性的权利和许可，以托管、使用、复制、重制、披露、出售、转售、发布、广播、重命名、归档、存储、缓存、公开表演、公开展示、重新格式化、翻译、传输、摘录（全部或部分）和分发此类贡献（包括但不限于您的图像和声音）用于任何目的、商业、广告或其他目的，并准备其衍生作品，或将其纳入其他作品，并授予和授权上述许可的再许可。使用和分发可以通过任何媒体格式和通过任何媒体渠道进行。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">此许可将适用于现在已知或以后开发的任何形式、媒体或技术，并包括我们使用您的姓名、公司名称和特许经营名称（如适用）以及您提供的任何商标、服务标志、商品名称、徽标以及个人和商业图像。您放弃您对贡献的所有精神权利，并保证在您的贡献中未以其他方式主张精神权利。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们不对您的贡献主张任何所有权。您保留对您的所有贡献以及与您的贡献相关的任何知识产权或其他专有权利的完全所有权。对于您在服务上任何区域提供的您的贡献中的任何声明或陈述，我们概不负责。您对您在服务上的贡献承担全部责任，并明确同意免除我们的任何及所有责任，并且不就您的贡献对我们采取任何法律行动。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们有权根据我们的自行和绝对酌情权，(1) 编辑、删减或以其他方式更改任何贡献；(2) 对任何贡献进行重新分类，以将它们放置在服务上更合适的位置；以及 (3) 随时出于任何原因预先筛选或删除任何贡献，恕不另行通知。我们没有义务监控您的贡献。</p>

        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">7. 第三方网站和内容</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">本服务可能包含（或您可能通过本网站被发送）指向其他网站（“第三方网站”）的链接，以及属于第三方或源自第三方的文章、照片、文字、图形、图片、设计、音乐、声音、视频、信息、应用程序、软件和其他内容或项目（“第三方内容”）。此类第三方网站和第三方内容未经我们调查、监控或检查其准确性、适当性或完整性，我们不对通过本服务访问的任何第三方网站或通过本服务发布、提供或安装的任何第三方内容负责，包括第三方网站或第三方内容的内容、准确性、攻击性、意见、可靠性、隐私做法或其他政策。包含、链接到或允许使用或安装任何第三方网站或任何第三方内容，并不意味着我们对其予以批准或认可。如果您决定离开本服务并访问第三方网站，或使用或安装任何第三方内容，您需自行承担风险，并且您应该注意这些法律条款不再适用。您应查看从本服务导航到的任何网站的适用条款和政策，包括隐私和数据收集做法，或与您从本服务使用或安装的任何应用程序相关的条款和政策。您通过第三方网站进行的任何购买都将通过其他网站并从其他公司进行，我们对于此类购买（专用于您和适用的第三方之间）不承担任何责任。您同意并承认我们不认可第三方网站上提供的产品或服务，并且您将使我们免受因您购买此类产品或服务而造成的任何伤害。此外，您将使我们免受因任何第三方内容或与第三方网站的任何联系而给您造成的任何损失或以任何方式给您带来的任何伤害。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">8. 服务管理</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">我们保留以下权利，但不承担以下义务：(1) 监控本服务是否有违反这些法律条款的行为；(2) 对任何我们全权酌情认为违反法律或本法律条款的人采取适当的法律行动，包括但不限于向执法部门举报该用户；(3) 根据我们全权酌情决定，在不限制的情况下，拒绝、限制访问、限制您的任何贡献或其任何部分的可用性或禁用（在技术可行的范围内）；(4) 根据我们全权酌情决定，在不限制、不提前通知或不承担任何责任的情况下，从本服务中删除或以其他方式禁用所有尺寸过大或以任何方式对我们的系统造成负担的文件和内容；以及 (5) 以旨在保护我们的权利和财产并促进本服务正常运行的方式管理本服务。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">9. 隐私政策</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">我们关心数据隐私和安全。通过使用本服务，您同意接受发布在服务上的隐私政策的约束，该政策已纳入这些法律条款。请注意，本服务托管在美国。如果您从世界任何其他国家/地区访问本服务，而该国家/地区关于个人数据收集、使用或披露的法律或其他要求与美国适用法律不同，则通过您继续使用本服务，您正在将您的数据转移到美国，并且您明确同意将您的数据转移到美国并在美国进行处理。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">10. 侵权通知</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">我们尊重他人的知识产权。如果您认为本服务上或通过本服务提供的任何材料侵犯了您拥有或控制的任何版权，请立即使用下面提供的联系信息通知我们（“通知”）。您的通知副本将被发送给发布或存储通知中涉及材料的人员。请注意，根据适用法律，如果您在通知中做出重大虚假陈述，您可能需要承担损害赔偿责任。因此，如果您不确定本服务上或链接到的材料是否侵犯了您的版权，您应考虑首先联系律师。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">11. 期限与终止</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">这些法律条款在您使用本服务期间应保持完全有效。在不限制本法律条款任何其他规定的情况下，我们保留全权决定在不事先通知或不承担责任的情况下，拒绝任何人为任何理由或无理由访问和使用本服务（包括屏蔽某些 IP 地址）的权利，包括但不限于违反这些法律条款中包含的任何陈述、保证或契约，或违反任何适用法律或法规。我们可能会全权酌情随时终止您对服务的使用或参与，或删除您发布的任何内容或信息，恕不另行警告。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">如果我们出于任何原因终止或暂停您的帐户，您被禁止以您的名义、虚假或借用的名义或任何第三方的名义注册和创建新帐户，即使您可能是代表第三方行事。除了终止或暂停您的帐户之外，我们保留采取适当法律行动的权利，包括但不限于寻求民事、刑事和禁令救济。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">12. 修改和中断</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">我们保留在任何时间出于任何原因自行决定更改、修改或删除本服务内容的权利，恕不另行通知。但是，我们没有义务更新我们服务上的任何信息。我们将不对您或任何第三方对服务的任何修改、价格变化、暂停或终止负责。</p>
        <p className="text-neutral-400 leading-relaxed mb-4">我们不能保证服务将随时可用。我们可能会遇到硬件、软件或其他问题，或需要执行与服务相关的维护，从而导致中断、延迟或错误。我们保留在任何时间出于任何原因更改、修改、更新、暂停、终止或以其他方式修改本服务的权利，恕不另行通知您。您同意，对于您在服务任何停机或终止期间无法访问或使用服务而造成的任何损失、损坏或不便，我们不承担任何责任。这些法律条款中的任何内容均不应解释为要求我们维护和支持本服务，或提供与其相关的任何更正、更新或发布。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">13. 适用法律</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">这些法律条款应受越南法律管辖并根据其定义。Khang Vu 和您本人不可撤销地同意，越南法院对解决可能因这些法律条款而引起的任何争议拥有专属管辖权。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">14. 争议解决</h2>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">非正式谈判</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">为加快解决并控制由您或我们（单独称为“一方”，统称为“双方”）提起的与这些法律条款相关的所有争议、争议或主张（每一个为“争议”，统称为“争议”）的成本，双方同意在发起仲裁之前，首先尝试对任何争议（以下明文规定的争议除外）进行至少三十 (30) 天的非正式谈判。此类非正式谈判自一方向另一方发出书面通知时开始。</p>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">具有约束力的仲裁</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">如果双方未能通过非正式谈判解决争议，则应根据开始仲裁时有效的《联合国国际贸易法委员会仲裁规则》通过仲裁最终解决该争议。仲裁员人数为一 (1) 名。仲裁地（即法定地点）应为越南胡志明市。诉讼语言应为英语。这些法律条款的适用法律应为越南实体法。</p>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">限制</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">双方同意，任何仲裁应仅限于双方之间的单独争议。在法律允许的最大范围内，(a) 任何仲裁不得与其他诉讼合并；(b) 没有任何权利或权力可以基于集体诉讼方式对任何争议进行仲裁或利用集体诉讼程序；以及 (c) 没有任何权利或权力代表公众或其他任何人以假定的代表身份提起任何争议。</p>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">非正式谈判和仲裁的例外</h3>
        <p className="text-neutral-400 leading-relaxed mb-4">双方同意，以下争议不受上述有关非正式谈判具有约束力仲裁的条款的约束：(a) 任何寻求执行或保护一方的任何知识产权，或有关其有效性的争议；(b) 任何与盗窃、海盗、侵犯隐私或未经授权使用的指控有关的，或由此引起的争议；(c) 任何有关禁令救济的要求。如果发现本条款是非法或不可执行的，则双方均不会选择对本条款中发现是非法或不可执行的部分的任何争议进行仲裁，并且此类争议应由具有管辖权的法院在上面列出的管辖法院范围内决定，双方同意服从该法院的个人管辖权。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">15. 纠正</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">本服务上的信息可能包含印刷错误、不准确或遗漏，包括描述、定价、可用性以及各种其他信息。我们保留随时纠正任何错误、不准确或遗漏的权利，以及更改或更新本服务上的信息的权利，恕不另行通知。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">16. 免责声明</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">本服务按“原样”和“可用”基础提供。您同意，您对本服务的使用将由您自行承担风险。在法律允许的最大范围内，我们不承担与服务及您的使用相关的任何明示或暗示的保证，包括但不限于对适销性、特定用途的适用性和非侵权性的暗示保证。我们对服务内容的准确性或完整性，或链接到服务的任何网站或移动应用程序的内容，不做任何保证或陈述。对于以下情况，我们不承担任何责任：(1) 内容和材料的错误、错误或不准确；(2) 因您访问和使用服务而造成的任何性质的人身伤害或财产损失；(3) 任何未经授权访问或使用我们安全服务器和/或存储在其中的任何及所有个人信息和/或财务信息；(4) 与服务之间传输的任何中断或停止；(5) 任何第三方可能通过服务传输的任何漏洞、病毒、木马等；以及/或 (6) 任何内容和材料中的任何错误或遗漏，或者由于使用通过服务发布、传输或以其他方式提供的任何内容而导致的任何类型的损失或损害。我们不为任何第三方通过服务、任何带有超链接的网站，或任何出现在横幅或其他广告中的网站或移动应用程序广告或提供的产品或服务提供担保、背书、保证或承担责任，并且我们不会作为一方参与或以任何方式负责监控您与任何第三方产品或服务供应商之间的交易。如同在任何媒介或任何环境中购买产品或服务一样，您应该在适当的情况下运用最佳判断力并谨慎行事。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">17. 责任限制</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">在任何情况下，我们或我们的董事、员工或代理不对您或任何第三方因您使用服务而产生的任何直接、间接、后果性、惩戒性、偶然、特殊或惩罚性损害（包括利润损失、收入损失、数据丢失或其他损害）负责，即使我们已被告知发生此类损害的可能性。尽管本文中有任何相反的规定，但无论出于任何原因，且无论诉讼形式如何，我们对您的责任将始终限制在 100.00 美元以内。美国某些州的法律和国际法不允许限制默示担保或排除或限制某些损害。如果这些法律适用于您，则上述部分或全部免责声明或限制可能对您不适用，并且您可能拥有其他权利。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">18. 赔偿</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">您同意就任何第三方因以下情况提起的任何损失、损害、责任、索赔或要求（包括合理的律师费和费用）为我们（包括我们的子公司、附属公司及我们所有的管理人员、代理人、合作伙伴和员工）辩护、进行赔偿并使其免受损害：(1) 您的贡献；(2) 您对本服务的使用；(3) 违反本法律条款；(4) 违反您在这些法律条款中规定的陈述和保证；(5) 违反第三方的权利，包括但不限于知识产权；或 (6) 针对通过服务与您联系的服务其他用户的任何明显的有害行为。尽管有上述规定，我们保留自费对您需要赔偿的任何事项承担专属辩护和控制权的权利，并且您同意自费配合我们对这些索赔的辩护。一旦知晓任何此类索赔、诉讼或程序需要此赔偿，我们将尽合理努力通知您。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">19. 用户数据</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">为了管理本服务的性能，我们将保存您传输至本服务的某些数据，以及与您使用本服务相关的数据。尽管我们对数据进行定期的例行备份，但您完全负责所有您传输的数据，或与您使用本服务进行的任何活动相关的数据。您同意，对于任何此类数据的任何丢失或损坏，我们对您不承担任何责任，并且您在此放弃就任何此类数据的丢失或损坏向我们采取任何法律行动的权利。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">20. 电子通信、交易和签名</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">访问本服务、向我们发送电子邮件以及完成在线表格构成电子通信。您同意接收电子通信，并同意我们通过电子邮件和在本服务上以电子方式向您提供的所有协议、通知、披露和其他通信，满足此类通信必须采用书面形式的任何法律要求。您在此同意使用电子签名、合同、订单和其他记录，并同意以电子方式发送通知、政策以及由我们或通过服务发起或完成的交易的记录。您在此放弃适用任何司法管辖区的任何法规、条例、规则、法令或其他法律的任何权利或要求，这些法律要求保留原始签名或非电子记录的交付或保留，或对通过电子手段以外的任何方式付款或授信的要求。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">21. 加州用户和居民</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">如果任何对我们的投诉未得到令人满意的解决，您可以以书面形式联系加州消费者事务部消费者服务司投诉协助处，地址为 1625 North Market Blvd., Suite N 112, Sacramento, California 95834，或致电 (800) 952-5210 或 (916) 445-1254 联系他们。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">22. 其他条款</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">这些法律条款以及由我们在本服务上发布的任何政策或操作规则构成了您与我们之间的完整协议和谅解。我们未能行使或执行这些法律条款的任何权利或规定，不得视为放弃此类权利或规定。这些法律条款在法律允许的最大范围内有效。我们可以随时将任何或全部权利和义务转让给他人。对于因超出我们合理控制范围的任何原因引起的任何损失、损害、延误或未履行义务，我们概不负责。如果这些法律条款的任何规定或规定的一部分被确定为非法、无效或不可执行，那么该规定或该部分规定被视为可与这些法律条款分割，并不影响其余任何规定的有效性和可执行性。作为这些法律条款或使用服务的结果，您和我们之间没有建立任何合资企业、合伙企业、雇佣关系或代理关系。您同意，这些法律条款不会因为草拟了这些条款而被解释为对我们不利。您在此放弃因这些法律条款的电子形式以及各方未在此法律条款上签字所产生的所有可能存在的抗辩理由。</p>

        <h2 className="text-xl font-bold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">23. 联系我们</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">为了解决关于本服务的投诉或接收有关本服务使用的更多信息，请通过以下方式与我们联系：</p>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">Khang Vu</h3>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">胡志明市，越南</h3>
        <h3 className="text-lg font-semibold text-neutral-200 mt-6 mb-3">movelens@proton.me</h3>
      </motion.div>
    </div>
  );
}
