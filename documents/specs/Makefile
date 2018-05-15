%.tex: %.md
	pandoc -S --no-tex-ligatures --latex-engine=xelatex \
	  --template ~/.pandoc/new-default.latex \
	  -o $@ $<

%.pdf: %.tex
	latexmk -pdf -xelatex $*

clean:
	$(RM) $(patsubst %.md,%.pdf,$(wildcard *.md))
	$(RM) $(patsubst %.md,%.tex,$(wildcard *.md))
	$(RM) *.aux *.fdb_latexmk *.fls *.log *.out
