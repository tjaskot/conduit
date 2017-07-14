SELECT
	"BOOKS"."ID",
	"BOOKS"."NAME"
FROM
	"conduit-db"."BOOKS"
FULL JOIN"conduit-db"."BOOKS_STATUS"
	ON
		"BOOKS_STATUS"."BOOK_ID" = "BOOKS"."ID"
WHERE
	"BOOKS_STATUS"."ARTICLE_ID" = $1;