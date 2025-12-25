module.exports=[72921,e=>{"use strict";var t=e.i(15270);async function n(e){let t=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${function(){let e=process.env.OPENAI_API_KEY;if(!e)throw Error("OPENAI_API_KEY is not set");return e}()}`},body:JSON.stringify({model:"text-embedding-3-small",input:e.trim()})});if(!t.ok){let e=await t.text();throw Error(`OpenAI Embedding API error: ${t.status} ${e}`)}return(await t.json()).data[0].embedding}function i(e,t=8e3){let n=[],a=e.split(/\n\n+/),r="";for(let e of a)if(r.length+e.length+2<=t)r+=(r?"\n\n":"")+e;else if(r&&n.push(r),e.length>t){let i=e.split(/[.!?]+\s+/),a="";for(let e of i)a.length+e.length+2<=t?a+=(a?". ":"")+e:(a&&n.push(a),a=e);a&&(r=a)}else r=e;return r&&n.push(r),n.length>0?n:[e]}async function a(e){let a=await t.default.knowledgeBaseArticle.findUnique({where:{id:e}});if(!a)throw Error(`Article ${e} not found`);await t.default.$executeRawUnsafe('DELETE FROM "KBArticleEmbedding" WHERE "articleId" = $1',e);let r=i(`${a.title}

${a.content}`);for(let i=0;i<r.length;i++){let a=r[i],l=await n(a),d=`[${l.join(",")}]`;await t.default.$executeRawUnsafe(`INSERT INTO "KBArticleEmbedding" ("id", "articleId", "embedding", "chunkIndex", "chunkText", "createdAt")
       VALUES (gen_random_uuid(), $1, $2::vector, $3, $4, NOW())`,e,d,i,a)}}async function r(e,i={}){if(!e.trim())return[];let a=i.limit||5,l=await n(e),d=`[${l.join(",")}]`,o=["a.status = 'PUBLISHED'"],s=[d,a];if(i.tenantId){let e=s.length+1;o.push(`EXISTS (
      SELECT 1 FROM "TenantKBArticle" tka 
      WHERE tka."articleId" = a.id AND tka."tenantId" = $${e}
    )`),s.push(i.tenantId)}if(i.organizationId&&!i.userRoles?.includes("GLOBAL_ADMIN")){let e=s.length+1;o.push(`a."organizationId" = $${e}`),s.push(i.organizationId)}let u="WHERE "+o.join(" AND "),c=`SELECT 
      a.*,
      1 - (e.embedding <=> $1::vector) as similarity
    FROM "KnowledgeBaseArticle" a
    INNER JOIN "KBArticleEmbedding" e ON e."articleId" = a.id
    ${u}
    ORDER BY similarity DESC
    LIMIT $2`;return await t.default.$queryRawUnsafe(c,...s)}e.s(["chunkText",()=>i,"generateArticleEmbeddings",()=>a,"generateEmbedding",()=>n,"semanticSearchArticles",()=>r])}];

//# sourceMappingURL=lib_services_embedding-service_ts_5aa12106._.js.map