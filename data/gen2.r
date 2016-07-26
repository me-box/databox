library(ggplot2)
library(sitools)
library(scales)
library(reshape2)

with      <- read.csv("arbiter-with-10.csv")
with$Experiment <- rep('With Arbiter Registration', nrow(with))
without <- read.csv("arbiter-without-10.csv")
without$Experiment <- rep('Without Arbiter Registration', nrow(without))
data <- rbind(without, with)

data$stores    <- as.numeric(data$stores)
data$timestamp <- as.numeric(data$timestamp)

#with$timestamp    <- as.POSIXct(Sys.Date())+with$timestamp/1000
#without$timestamp <- as.POSIXct(Sys.Date())+without$timestamp/1000

formatter1000 <- function(x){
	x/1000
}

ggplot(data, aes(x = timestamp, y = stores, group=Experiment, color=Experiment))+
	geom_line(size=1.2)+
	geom_point(size=4, aes(shape = Experiment))+
	labs(x="Time (s)", y="Stores Launched")+
	scale_x_continuous(labels=formatter1000, limits = c(0, 175000))+
	scale_colour_brewer(palette = 'Set1')+
	theme_bw()+
	theme(
		panel.grid.major = element_line(colour = "grey80"),
		panel.grid.minor = element_line(colour = "grey90"),
		legend.justification=c(1, 0),
		legend.position=c(1, 0),
		axis.text = element_text(size = 20),
		axis.title = element_text(size = 24, face="bold"),
		legend.title = element_text(size = 24, face="bold"),
		legend.text = element_text(size=20)
	)

#	labs(x="Triplets", y="TX (bytes)", title="Test 1 TX")+
#	scale_y_continuous(labels=f2si)+
ggsave(width=10, height=3.5, file="arbiter.eps")


#data$rx <- as.numeric(data$rx)
#data$tx <- as.numeric(data$tx)
#
#v1 <- data[,c("triplets","name","type")]
#v2 <- aggregate(rx  ~ triplets + name + type, FUN = "mean", data = data)
#v3 <- aggregate(tx  ~ triplets + name + type, FUN = "mean", data = data)
#v4 <- aggregate(cpu ~ triplets + name + type, FUN = "mean", data = data)
#v5 <- aggregate(mem ~ triplets + name + type, FUN = "mean", data = data)
#data <- Reduce(function(...) merge(..., all=TRUE), list(v2, v3, v4, v5))
#data$io <- apply(data[,c("tx","rx")], 1, sum)
#data$io <- as.numeric(data$io)
#
##arbiter <- data[data$type == 'arbiter', ]
##drivers <- data[data$type == 'driver', ]
##stores  <- data[data$type == 'store', ]
##apps    <- data[data$type == 'app', ]
#
#levels(data$type)[levels(data$type)=='arbiter'] <- 'Arbiter'
#levels(data$type)[levels(data$type)=='driver']  <- 'Driver'
#levels(data$type)[levels(data$type)=='store']   <- 'Store'
#levels(data$type)[levels(data$type)=='app']     <- 'App'
#names(data)[names(data)=='type']  <- 'Type'
#
#data$bin <- factor(data$triplets)
#
#ggplot(data, aes(x=bin, y=cpu, colour=Type))+
#	geom_boxplot()+facet_grid(.~bin, scales="free")+
#	labs(x="Triplets", y="CPU (%)")+
#	scale_y_continuous(labels=percent)+
#	scale_colour_brewer(palette = 'Set1')+
#	theme_bw()+
#	theme(
#		#axis.text.x = element_blank(),
#		#axis.text.x = theme_text(size = 14),
#		axis.text = element_text(size = 20),
#		axis.title = element_text(size = 24, face="bold"),
#		#panel.margin = unit(0, "cm"),
#		panel.grid.major = element_line(colour = "grey80"),
#		panel.grid.minor = element_line(colour = "grey90"),
#		strip.background = element_blank(),
#		strip.text.x = element_blank(),
#		legend.title = element_text(size = 24, face="bold"),
#		legend.text = element_text(size=20)
#	)
#ggsave(width=20, height=3.5, file="cpu-bins.eps")
#
#ggplot(data, aes(x=bin, y=mem, colour=Type))+
#	geom_boxplot()+facet_grid(.~bin, scales="free")+
#	labs(x="Triplets", y="Memory (bytes)")+
#	scale_y_continuous(labels=f2si)+
#	scale_colour_brewer(palette = 'Set1')+
#	theme_bw()+
#	theme(
#		#axis.text.x = element_blank(),
#		#axis.text.x = theme_text(size = 14),
#		axis.text = element_text(size = 20),
#		axis.title = element_text(size = 24, face="bold"),
#		#panel.margin = unit(0, "cm"),
#		panel.grid.major = element_line(colour = "grey80"),
#		panel.grid.minor = element_line(colour = "grey90"),
#		strip.background = element_blank(),
#		strip.text.x = element_blank(),
#		legend.title = element_text(size = 24, face="bold"),
#		legend.text = element_text(size=20)
#	)
#ggsave(width=20, height=3.5, file="mem-bins.eps")
#
##ggplot(data, aes(x=triplets, y=rx, group=Type, color=Type))+geom_line()+
##	labs(x="Triplets", y="RX (bytes)", title="Test 1 RX")+
##	scale_y_continuous(labels=f2si)+
##ggsave(width=10, height=3.5, file="rx-bins.png")
#
##ggplot(data, aes(x=triplets, y=tx, group=Type, color=Type))+geom_line()+
##	labs(x="Triplets", y="TX (bytes)", title="Test 1 TX")+
##	scale_y_continuous(labels=f2si)+
##ggsave(width=10, height=3.5, file="tx-bins.png")
#
#io <- aggregate(io ~ triplets + Type, FUN = "sum", data = data)
#
#ggplot(io, aes(x=triplets, y=io, group=Type, color=Type))+
#	geom_line(size=1.2)+
#	geom_point(size=4, aes(shape = Type))+
#	labs(x="Triplets", y="Net I/O (bytes)")+
#	scale_y_continuous(labels=f2si)+
#	scale_colour_brewer(palette = 'Set1')+
#	theme_bw()+
#	theme(
#		panel.grid.major = element_line(colour = "grey80"),
#		panel.grid.minor = element_line(colour = "grey90"),
#		legend.justification=c(0, 1),
#		legend.position=c(0, 1),
#		axis.text = element_text(size = 20),
#		axis.title = element_text(size = 24, face="bold"),
#		legend.title = element_text(size = 24, face="bold"),
#		legend.text = element_text(size=20)
#	)
#ggsave(width=10, height=3.5, file="io-bins.eps")
